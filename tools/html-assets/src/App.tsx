import { Route, Switch } from "wouter";
import BannersPage from "./pages/BannersPage";
import MochiStandardPage from "./pages/banners/MochiStandardPage";
import MochiWidePage from "./pages/banners/MochiWidePage";
import BentoStandardPage from "./pages/banners/BentoStandardPage";

function App() {
    return (
        <Switch>
            <Route path="/" component={BannersPage} />
            <Route
                path="/banners/mochi-standard"
                component={MochiStandardPage}
            />
            <Route path="/banners/mochi-wide" component={MochiWidePage} />
            <Route
                path="/banners/bento-standard"
                component={BentoStandardPage}
            />
        </Switch>
    );
}

export default App;
