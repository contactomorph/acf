"use client";
import { useState } from 'react';
import { ClientPage } from './ClientPage';
import { Router } from './routing/Router';
import TrainingCreationPage from './TrainingCreationPage';
import TrainingHistoryPage from './TrainingHistoryPage';
import ModelComponent from './ModelComponent';
import Model from './model/Model';

export default function Home(): JSX.Element {
  const [model, setModel] = useState<Model | null>(null);
  return (
    <>
    <ModelComponent setModel={setModel}/>
    <Router>
      {{ ctor: cl => (<TrainingHistoryPage client={cl} model={model} />), route: 'history' }}
      {{ ctor: cl => (<TrainingCreationPage client={cl} />), route: 'creation' }}
      {{ ctor: cl => (<ClientPage client={cl} color="brown" />), route: 'test1' }}
      {{ ctor: cl => (<ClientPage client={cl} color="pink" />), route: 'test2' }}
    </Router>
    </>
  )
}

