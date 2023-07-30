"use client";
import { ClientPage } from './ClientPage';
import { Router } from './routing/Router';
import ProgramCreation from './ProgramCreation';

export default function Home(): JSX.Element {
  return (
    <Router>
      {{ ctor: cl => (<ProgramCreation client={cl}/>), route: 'a' }}
      {{ ctor: cl => (<ClientPage client={cl} color="pink" />), route: 'b' }}
      {{ ctor: cl => (<ClientPage client={cl} color="brown" />), route: 'c' }}
    </Router>
  )
}

