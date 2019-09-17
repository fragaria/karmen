import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import Menu from './components/menu';
import Footer from './components/footer';
import Heartbeat from './components/heartbeat';

import PrinterList from './routes/printer-list';
import PrinterDetail from './routes/printer-detail';
import AddPrinter from './routes/add-printer';
import Settings from './routes/settings';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Menu />
        <Switch>
          <Route path="/add-printer" exact component={AddPrinter} />
          <Route path="/settings" exact component={Settings} />
          <Route path="/printers/:ip" exact component={PrinterDetail} />
          <Route path="/" exact component={PrinterList} />
        </Switch>
        <Heartbeat />
        <Footer />
       </BrowserRouter>
    </div>
  );
}

export default App;
