import pandas as pd
import duckdb
import os
import glob
import numpy as np

def main():
    # Base paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    gdrive_base = "/Users/galaxy.jang/Google Drive/공유 드라이브"
    onedrive_base = "/Users/galaxy.jang/OneDrive - 지바이크/서비스운영본부 - 현장데이터 개발센터"
    
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
    
    # 2. DuckDB Connection for Parquet aggregation
    con = duckdb.connect()
    
    sources = {
        "daily_stats": os.path.join(gdrive_base, "gbike.rich_daily_statistics"),
        "deploy_spot": os.path.join(gdrive_base, "gbike.rich_deploy_spot_info"),
        "unused_72h": os.path.join(gdrive_base, "gbike_smartops.vehicle_statistics_data"),
        "task_stats": os.path.join(gdrive_base, "gbike.rich_task_statistics"),
        "deploy_zone_usages": os.path.join(gdrive_base, "gbike.rich_deploy_zone_usages"),
        "deploy_used_time": os.path.join(gdrive_base, "gbike.rich_deploy_used_time")
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
                # Get distinct Year and Month
                yms = con.execute(f"SELECT DISTINCT EXTRACT(YEAR FROM CAST(date AS DATE)) as y, EXTRACT(MONTH FROM CAST(date AS DATE)) as m FROM temp_{name} WHERE date IS NOT NULL").fetchall()
                
                for y, m in yms:
                    if y is None or m is None:
                        continue
                    part_path = os.path.join(frontend_data_dir, f"{name}_{int(y)}_{int(m):02d}.parquet")
                    con.execute(f"COPY (SELECT * FROM temp_{name} WHERE EXTRACT(YEAR FROM CAST(date AS DATE)) = {y} AND EXTRACT(MONTH FROM CAST(date AS DATE)) = {m}) TO '{part_path}' (FORMAT PARQUET)")
                
            print(f"Successfully processed {name}.")
        except Exception as e:
            print(f"Error processing {name}: {e}")

    print("ETL Process Complete.")

if __name__ == "__main__":
    main()
