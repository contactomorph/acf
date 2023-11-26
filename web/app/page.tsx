"use client";
import { ClientPage } from './ClientPage';
import { Router, RouterKedge } from './routing/Router';
import TrainingCreationPage from './TrainingCreationPage';
import TrainingHistoryPage from './TrainingHistoryPage';
import FirebaseHistoryRepository from "./backend/FirebaseHistoryRepository";
import Model from './model/Model';

const MODEL = new Model(new FirebaseHistoryRepository());
const KEDGE = new RouterKedge();

export default function Home(): JSX.Element {
  return (
    <Router kedge={KEDGE}>
      {{ ctor: cl => (<TrainingHistoryPage client={cl} model={MODEL} />), route: 'history' }}
      {{ ctor: cl => (<TrainingCreationPage client={cl} />), route: 'creation' }}
      {{ ctor: cl => (<ClientPage client={cl} color="brown" />), route: 'test1' }}
      {{ ctor: cl => (<ClientPage client={cl} color="pink" />), route: 'test2' }}
    </Router>
  )
}

