import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

import Menu from './components/menu';
import Heartbeat from './components/heartbeat';

import PrinterList from './routes/printer-list';
import GcodeList from './routes/gcode-list'
import PrinterDetail from './routes/printer-detail';
import AddPrinter from './routes/add-printer';
import AddGcode from './routes/add-gcode';
import Settings from './routes/settings';

function App() {
  return (
    <>
      <BrowserRouter>
        <Menu />
        <main>
          <Switch>
            <Route path="/add-printer" exact component={AddPrinter} />
            <Route path="/add-gcode" exact component={AddGcode} />
            <Route path="/settings" exact component={Settings} />
            <Route path="/gcodes" exact component={GcodeList} />
            <Route path="/printers/:ip" exact component={PrinterDetail} />
            <Route path="/" exact component={PrinterList} />
          </Switch>
          <Heartbeat />
        </main>
      </BrowserRouter>
      <footer>
        <section>
          &copy; 2019
          <a href="https://fragaria.cz" target="_blank" rel="noopener noreferrer">Fragaria s.r.o.</a>
        </section>
        <section>
          <a href="https://github.com/fragaria/karmen/blob/master/LICENSE.txt" target="_blank" rel="noopener noreferrer">License</a>
          <a href="https://github.com/fragaria/karmen" target="_blank" rel="noopener noreferrer">Source</a>
          <a href={`https://github.com/fragaria/karmen/releases/tag/${process.env.REACT_APP_GIT_REV}`} target="_blank" rel="noopener noreferrer">{process.env.REACT_APP_GIT_REV}</a>
        </section>
      </footer>
    </>
  );
}

export default App;
