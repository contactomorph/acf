"use client";
import { ClientPage } from './ClientPage';
import { Router } from './routing/Router';
import TrainingCreationPage from './TrainingCreationPage';
import TrainingHistoryPage from './TrainingHistoryPage';

export default function Home(): JSX.Element {
  return (
    <Router>
      {{ ctor: cl => (<TrainingHistoryPage client={cl} />), route: 'history' }}
      {{ ctor: cl => (<TrainingCreationPage client={cl} />), route: 'creation' }}
      {{ ctor: cl => (<ClientPage client={cl} color="brown" />), route: 'test1' }}
      {{ ctor: cl => (<ClientPage client={cl} color="pink" />), route: 'test2' }}
    </Router>
  )
}

