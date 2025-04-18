import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Register() {
  const { registerUser } = useContext(AuthContext);
  const [form, setForm]   = useState({ username:'', email:'', password:'' });
  const [error, setError] = useState('');

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await registerUser(form);
    } catch (err) {
      setError(err.response?.data.detail || 'Kayıt başarısız');
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4">
      <h2 className="text-xl mb-4">Kayıt Ol</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text"
        placeholder="Kullanıcı adı"
        value={form.username}
        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
        className="block w-full mb-2 p-2 border rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        className="block w-full mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Şifre"
        value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        className="block w-full mb-4 p-2 border rounded"
      />
      <button className="w-full p-2 bg-green-500 text-white rounded">Kayıt Ol</button>
    </form>
  );
}
