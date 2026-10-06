"use client";

import { FormEvent, useState } from 'react';
import { Headphones, LockKeyhole, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setError(''); try { const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, password }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Login failed'); router.replace('/admin'); } catch (err:any) { setError(err.message || 'Login failed'); } finally { setBusy(false); } };
  return <main className="login"><form className="login-card" onSubmit={submit}><div className="login-brand"><span className="brand-mark"><Headphones size={18}/></span><span>Qanoni Audio Studio</span></div><h1>Welcome back.</h1><p>Private control room for the public audio platform. Visitors only see the public listening experience.</p><div className="field"><label>Email</label><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@example.com" /></div><div className="field" style={{marginTop:12}}><label>Password</label><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" /></div>{error && <p className="error-note">{error}</p>}<button className="btn btn-primary" style={{width:'100%',marginTop:16}} disabled={busy}>{busy?'Signing in…':<>Sign in<ArrowRight size={16}/></>}</button><div style={{marginTop:14,color:'#68727d',fontSize:10,display:'flex',alignItems:'center',gap:6}}><LockKeyhole size={13}/>Session protected by an httpOnly cookie.</div></form></main>;
}
