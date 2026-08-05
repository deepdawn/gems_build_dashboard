import pandas as pd
import duckdb
import os
import sys
import glob
import numpy as np
from datetime import datetime, timedelta

# User's external script path for polars extraction
sys.path.append(f'{os.path.expanduser("~")}/anti_codebase/scripts/python/utils')
try:
    from read_rich_orders_polars import load_rich_orders_polars
except ImportError:
    load_rich_orders_polars = None

def main():
    # Base paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    gdrive_base = f"{os.path.expanduser('~')}/Google Drive/공유 드라이브"
    onedrive_base = f"{os.path.expanduser('~')}/OneDrive - 지바이크/서비스운영본부 - 현장데이터 개발센터"
    
    frontend_data_dir = os.path.join(project_root, "frontend", "public", "data")
    os.makedirs(frontend_data_dir, exist_ok=True)
    
    print("Starting ETL Process...")
    
    # 1. Excel (Revenue Goal) to Parquet
    print("Processing Revenue Goal...")
    excel_path = os.path.join(onedrive_base, "2026년 목표 매출.xlsx")
    try:
        df_goal = pd.read_excel(excel_path, sheet_name='dashboard_use')
        # Replace '-' with NaN for numeric conversion
        df_goal.replace('-', np.nan, inplace=True)
        for col in ['경영목표', '경영목표할당대수', '경영목표대당매출']:
            if col in df_goal.columns:
                df_goal[col] = pd.to_numeric(df_goal[col], errors='coerce')
        
        df_goal.to_parquet(os.path.join(frontend_data_dir, "revenue_goal.parquet"), index=False)
        print("Revenue Goal exported successfully.")
    except Exception as e:
        print(f"Error processing Revenue Goal: {e}")
    
    con = duckdb.connect()
    
    home_dir = os.path.expanduser('~')
    sources = {
        "daily_stats": os.path.join(gdrive_base, "gbike.rich_daily_statistics"),
        "deploy_spot": os.path.join(gdrive_base, "gbike.rich_deploy_spot_info"),
        "unused_72h": os.path.join(gdrive_base, "gbike_smartops.vehicle_statistics_data"),
        "task_stats": os.path.join(gdrive_base, "gbike.rich_task_statistics"),
        "deploy_zone_usages": os.path.join(gdrive_base, "gbike.rich_deploy_zone_usages"),
        "deploy_used_time": os.path.join(gdrive_base, "gbike.rich_deploy_used_time"),
        "weather_data": os.path.join(home_dir, "Google Drive/공유 드라이브/gbike_smartops.weather_data"),
        "battery_data": os.path.join(home_dir, "Google Drive/공유 드라이브/gbike.rich_battery_data")
    }
    
    for name, folder in sources.items():
        out_path = os.path.join(frontend_data_dir, f"{name}.parquet")
        glob_pattern = os.path.join(folder, "**", "*.parquet")
        
        # Check if any parquet files exist
        files = glob.glob(glob_pattern, recursive=True)
        if not files:
            print(f"Skipping {name}: No parquet files found in {folder}")
            # Create an empty parquet file to avoid 404 in frontend
            pd.DataFrame().to_parquet(out_path)
            continue
            
        print(f"Processing {name} from {folder} to {out_path}...")
        try:
            if name == "deploy_spot":
                con.execute(f"""
                    COPY (
                        SELECT * FROM read_parquet('{glob_pattern}', hive_partitioning=true, union_by_name=true)
                    ) TO '{out_path}' (FORMAT PARQUET)
                """)
            else:
                con.execute(f"CREATE OR REPLACE TEMP VIEW temp_{name} AS SELECT * FROM read_parquet('{glob_pattern}', hive_partitioning=true, union_by_name=true)")
                date_col = "dt" if name == "battery_data" else "date"
                # Get distinct Year and Month
                yms = con.execute(f"SELECT DISTINCT EXTRACT(YEAR FROM CAST({date_col} AS DATE)) as y, EXTRACT(MONTH FROM CAST({date_col} AS DATE)) as m FROM temp_{name} WHERE {date_col} IS NOT NULL").fetchall()
                
                for y, m in yms:
                    if y is None or m is None:
                        continue
                    part_path = os.path.join(frontend_data_dir, f"{name}_{int(y)}_{int(m):02d}.parquet")
                    con.execute(f"COPY (SELECT * FROM temp_{name} WHERE EXTRACT(YEAR FROM CAST({date_col} AS DATE)) = {y} AND EXTRACT(MONTH FROM CAST({date_col} AS DATE)) = {m}) TO '{part_path}' (FORMAT PARQUET)")
                
            print(f"Successfully processed {name}.")
        except Exception as e:
            print(f"Error processing {name}: {e}")

    # 3. Extract 1-day of order data using load_rich_orders_polars
    print("Processing rich_orders (1 day)...")
    if load_rich_orders_polars is not None:
        try:
            target_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=28)).strftime('%Y-%m-%d')
            # Extract specific columns
            cols = ['dt', 'low_region_id', 'start_lat', 'start_lng', 'end_lat', 'end_lng', 'vehicle_type']
            
            print(f"Loading rich_orders from {start_date} to {target_date}...")
            df_orders = load_rich_orders_polars(
                start_date, 
                target_date, 
                columns=cols,
                base_path=f"{os.path.expanduser('~')}/Google Drive/공유 드라이브/gbike.rich_orders"
            )
            
            if df_orders is not None and not df_orders.is_empty():
                # Load region hierarchy to join
                region_path = f"{os.path.expanduser('~')}/Google Drive/공유 드라이브/gbike.rich_region/rich_region_hierarchy.parquet"
                import polars as pl
                if os.path.exists(region_path):
                    df_region = pl.read_parquet(region_path)
                    
                    # Ensure same data type for join
                    df_orders = df_orders.with_columns(pl.col('low_region_id').cast(pl.Int64))
                    df_region = df_region.with_columns(pl.col('region_id').cast(pl.Int64))
                    
                    # Join with region hierarchy
                    df_orders = df_orders.join(df_region, left_on='low_region_id', right_on='region_id', how='left')
                    
                    # Rename columns for DuckDB matching
                    df_orders = df_orders.rename({
                        '대지역': 'high_region_name',
                        '중지역': 'middle_region_name',
                        'vehicle_type': '기기구분'
                    })
                    
                    # Clean device type
                    df_orders = df_orders.with_columns(
                        pl.when(pl.col('기기구분').str.contains('bicycle')).then(pl.lit('자전거'))
                        .when(pl.col('기기구분').str.contains('scooter')).then(pl.lit('킥보드'))
                        .otherwise(pl.col('기기구분')).alias('기기구분')
                    )
                    
                    # Format dt as date directly from datetime
                    df_orders = df_orders.with_columns(
                        pl.col('dt').cast(pl.Date).alias('date')
                    )
                
                out_path = os.path.join(frontend_data_dir, f"orders.parquet")
                df_orders.write_parquet(out_path)
                print(f"Successfully processed rich_orders: {out_path}")
            else:
                print(f"No orders found for {target_date}.")
        except Exception as e:
            print(f"Error processing rich_orders: {e}")
    else:
        print("Skipping rich_orders: read_rich_orders_polars module not found.")

    print("ETL Process Complete.")

if __name__ == "__main__":
    main()
