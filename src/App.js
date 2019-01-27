import * as React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { ApolloProvider } from 'react-apollo'
import { Provider } from 'mobx-react'
import { Client } from './Client'
import MobxStore from './MobxStore'
import { Menu } from 'semantic-ui-react'
import { NavItem } from 'components/Elements/NavItem'

// Route Pages
import Main from 'components/Main'
import About from 'components/About'
import Profile from 'components/Profile'
import FourOhFour from 'components/FourOhFour'

// import DevTools from 'mobx-react-devtools'
// import TodoExample from 'componentsTodo'
import './App.css'

// This is to be able to inspect the store from the inspector at any time.
let mobxStore = new MobxStore()
window.mobxStore = mobxStore

const App = () => (
  <Provider store={mobxStore}>
    <Router>
      <ApolloProvider client={Client}>
        <Menu secondary>
          <Menu.Item header>Microgrid Appliance Analysis Tool</Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item as={NavItem} to="/" name="Main" />
            <Menu.Item as={NavItem} to="/about" name="About" />
            <Menu.Item as={NavItem} to="/profile" name="Logout" />
          </Menu.Menu>
        </Menu>

        <div className="main-wrapper">
          <Switch>
            <Route component={Main} />
            <Route path="/tool" component={Main} />
            <Route path="/about" component={About} />
            <Route path="/profile" component={Profile} />
            <Route component={FourOhFour} />
          </Switch>
        </div>

        {/* <DevTools /> */}
      </ApolloProvider>
    </Router>
  </Provider>
)

export default App
