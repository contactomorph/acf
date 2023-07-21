"use client";
import { ClientPage } from './ClientPage';
import { Router } from './routing/Router';
import ProgramCreation from './ProgramCreation';

export default function Home(): JSX.Element {
  return (
    <Router>
      {[n => (<ProgramCreation n={n}/>), 'a']}
      {[n => (<ClientPage n={n} color="blue" />), 'b']}
      {[n => (<ClientPage n={n} color="red" />), 'c']}
    </Router>
  )
}

