"use client";
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
      {{ ctor: (cl, v) => (<TrainingCreationPage client={cl} visible={v} />), route: 'creation' }}
    </Router>
  )
}

