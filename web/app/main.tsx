import React from 'react';
import ReactDOM from 'react-dom/client';
import icon from './assets/icon.svg';
import './index.css';
import Model from './model/Model';
import FirebaseHistoryRepository from './backend/FirebaseHistoryRepository';
import { Router, RouterKedge } from './routing/Router.tsx';
import TrainingHistoryPage from './TrainingHistoryPage.tsx';
import TrainingCreationPage from './TrainingCreationPage.tsx';

/* eslint-disable react-refresh/only-export-components */
const MODEL = new Model(new FirebaseHistoryRepository());
const KEDGE = new RouterKedge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <header>
      <img className='header-content' src={icon} />
      <div className='header-content'>Allures Athlétic Cœur de fond</div>
    </header>
    <main>
      <Router kedge={KEDGE}>
        {{ ctor: cl => (<TrainingHistoryPage client={cl} model={MODEL} />), route: 'history' }}
        {{ ctor: (cl, v) => (<TrainingCreationPage client={cl} visible={v} />), route: 'creation' }}
      </Router>
    </main>
  </React.StrictMode>,
)
