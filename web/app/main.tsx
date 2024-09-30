import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Model from './model/Model';
import FirebaseHistoryRepository from './backend/FirebaseHistoryRepository.ts';
import { Router, RouterKedge } from './routing/Router.tsx';
import TrainingHistoryPage from './TrainingHistoryPage.tsx';
import TrainingCreationPage from './TrainingCreationPage.tsx';
import TrainingDisplayPage from './TrainingDisplayPage.tsx';

/* eslint-disable react-refresh/only-export-components */
const MODEL = new Model(new FirebaseHistoryRepository());
const KEDGE = new RouterKedge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main>
      <Router kedge={KEDGE}>
        {{
          ctor: () => (<div/>),
          route: 'default',
        }}
        {{
          ctor: (cl, v) => (<TrainingHistoryPage client={cl} model={MODEL} visible={v} />),
          route: 'history',
        }}
        {{
          ctor: (cl, v) => (<TrainingCreationPage client={cl} model={MODEL} visible={v} />),
          route: 'creation',
        }}
        {{
          ctor: (cl, v) => (<TrainingDisplayPage client={cl} model={MODEL} visible={v} />),
          route: 'display',
        }}
      </Router>
    </main>
  </React.StrictMode>,
)
