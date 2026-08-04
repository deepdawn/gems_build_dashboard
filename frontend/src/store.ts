import { createStore, combineReducers, applyMiddleware } from 'redux';
// @ts-ignore
import keplerGlReducer from '@kepler.gl/reducers';
// @ts-ignore
import { taskMiddleware } from 'react-palm/tasks';

const customizedKeplerGlReducer = keplerGlReducer.initialState({
  uiState: {
    readOnly: true,
    currentModal: null,
  },
});

const reducers = combineReducers({
  keplerGl: customizedKeplerGlReducer,
});

export const store = createStore(
  reducers,
  {},
  applyMiddleware(taskMiddleware)
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
