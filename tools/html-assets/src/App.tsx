import { Route, Switch } from 'wouter'
import BannersPage from './pages/BannersPage'
import MochiStandardPage from './pages/banners/MochiStandardPage'
import MochiWidePage from './pages/banners/MochiWidePage'

function App() {
    return (
        <Switch>
            <Route path="/" component={BannersPage} />
            <Route path="/banners/mochi-standard" component={MochiStandardPage} />
            <Route path="/banners/mochi-wide" component={MochiWidePage} />
        </Switch>
    )
}

export default App
