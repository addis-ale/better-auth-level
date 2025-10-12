// /**
//  * Next.js Integration Example
//  *
//  * Shows how to use Better Auth Monitor in a real Next.js application
//  */

// import { betterAuth } from "better-auth";
// import { betterAuthMonitor } from "../src/plugin";

// // pages/api/auth/[...auth].ts
// export const auth = betterAuth({
//   database: {
//     provider: "postgresql",
//     url: process.env.DATABASE_URL!
//   },
//   emailAndPassword: {
//     enabled: true
//   },
//   plugins: [
//     betterAuthMonitor({
//       failedLoginThreshold: 3,
//       failedLoginWindow: 5,
//       logger: (event) => {
//         // Log to console in development
//         console.log(`🚨 ${event.type}: ${event.userId} from ${event.ip}`);

//         // Send to monitoring service in production
//         if (process.env.NODE_ENV === 'production') {
//           fetch(process.env.MONITORING_WEBHOOK_URL!, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(event)
//           }).catch(console.error);
//         }
//       }
//     })
//   ]
// });

// // pages/api/auth/sign-in.ts
// export async function POST(request: Request) {
//   try {
//     const { email, password } = await request.json();

//     // This will automatically trigger monitoring hooks
//     const result = await auth.api.signInEmail({
//       body: { email, password }
//     });

//     return Response.json(result);
//   } catch (error) {
//     // Failed login - monitoring plugin tracks this automatically
//     return Response.json(
//       { error: "Invalid credentials" },
//       { status: 401 }
//     );
//   }
// }

// // components/LoginForm.tsx
// export function LoginForm() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const response = await fetch('/api/auth/sign-in', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password })
//       });

//       if (!response.ok) {
//         // Failed login - monitoring plugin will track this
//         const data = await response.json();
//         setError(data.error);
//         return;
//       }

//       // Successful login
//       window.location.href = '/dashboard';
//     } catch (err) {
//       setError('Login failed');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         type="email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         placeholder="Email"
//         required
//       />
//       <input
//         type="password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         placeholder="Password"
//         required
//       />
//       {error && <div className="error">{error}</div>}
//       <button type="submit">Login</button>
//     </form>
//   );
// }

// // pages/admin/security.tsx - Security Dashboard
// export default function SecurityDashboard() {
//   const [events, setEvents] = useState([]);

//   useEffect(() => {
//     // Fetch security events
//     fetch('/api/auth/monitor/events')
//       .then(res => res.json())
//       .then(data => setEvents(data.events));
//   }, []);

//   return (
//     <div>
//       <h1>Security Dashboard</h1>
//       <div className="events">
//         {events.map((event, i) => (
//           <div key={i} className={`event ${event.type}`}>
//             <h3>{event.type.toUpperCase()}</h3>
//             <p>User: {event.userId}</p>
//             <p>IP: {event.ip}</p>
//             <p>Time: {new Date(event.timestamp).toLocaleString()}</p>
//             {event.attempts && <p>Attempts: {event.attempts}</p>}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
