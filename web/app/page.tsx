"use client";
import { ClientPage } from './ClientPage';
import { Router } from './routing/Router';
import TrainingCreationPage from './TrainingCreationPage';

export default function Home(): JSX.Element {
  return (
    <Router>
      {{ ctor: cl => (<TrainingCreationPage client={cl}/>), route: 'a' }}
      {{ ctor: cl => (<ClientPage client={cl} color="pink" />), route: 'b' }}
      {{ ctor: cl => (<ClientPage client={cl} color="brown" />), route: 'c' }}
    </Router>
  )
}

