import AppHeader from './layouts/AppHeader';
import AppFooter from './layouts/AppFooter';
import RecipeDetail from '../features/recipes/pages/RecipeDetail';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-shell-main">
        <RecipeDetail />
      </main>
      <AppFooter />
    </div>
  );
}
