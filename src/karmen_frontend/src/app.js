import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import Menu from './components/menu';
import Footer from './components/footer';

import PrinterList from './routes/printer-list';
import AddPrinter from './routes/add-printer';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Menu />
        <Switch>
          <Route path="/add-printer" exact component={AddPrinter} />
          <Route path="/" exact component={PrinterList} />
        </Switch>
        <Footer />
       </BrowserRouter>
    </div>
  );
}

export default App;
