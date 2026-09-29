import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="login">
      <div className="kort">
        <div>
          <h1>Vietnam 2026</h1>
          <p className="muted">26. december – 12. januar</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
