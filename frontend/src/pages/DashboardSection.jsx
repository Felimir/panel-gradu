import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Trophy, DollarSign, Users, Ticket, Target, Activity } from 'lucide-react';

const COLORS = ['var(--accent-primary)', 'var(--color-success)', 'var(--color-purple)', 'var(--color-orange)', 'var(--color-rose)', 'var(--color-warning)', '#34D399', '#60A5FA'];

const CHART_TOOLTIP_STYLE = {
   background: 'rgba(13, 20, 38, 0.97)',
   border: '1px solid rgba(59, 130, 246, 0.25)',
   borderRadius: '10px',
   color: '#F8FAFF',
};

const DashboardSection = () => {
   const [data, setData] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const loadDashboard = async () => {
         try {
            const res = await fetchWithAuth('/dashboard/stats');
            setData(res);
         } catch (err) {
            console.error('Error loading dashboard:', err);
         } finally {
            setLoading(false);
         }
      };
      loadDashboard();
   }, []);

   if (loading) {
      return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className="glass-panel skeleton" style={{ height: '90px' }} />
            <div className="grid-kpi-secondary">
               {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-panel skeleton" style={{ height: '110px' }} />
               ))}
            </div>
            <div className="grid-charts">
               <div className="glass-panel skeleton" style={{ height: '330px' }} />
               <div className="glass-panel skeleton" style={{ height: '330px' }} />
            </div>
            <div className="grid-widgets">
               <div className="glass-panel skeleton" style={{ height: '200px' }} />
               <div className="glass-panel skeleton" style={{ height: '200px' }} />
            </div>
         </div>
      );
   }

   if (!data || !data.metrics) {
      return (
         <div className="glass-panel fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-error)' }}>Error accediendo al centro de control.</p>
         </div>
      );
   }

   const { metrics = {}, collectionByClass = [], topSellers = [], defaulters = [] } = data || {};
   const {
      currentBalance = 0, globalTarget = 1000000, totalSoldRaffles = 0, monthlySoldRaffles = 0,
      delinquentCount = 0, uptodateCount = 0, lastIncome = { val: 0, dt: null, descrip: '-' },
      projectedBalance = 0, activeStudents = 0
   } = metrics;

   const progressPercent = globalTarget > 0 ? Math.min(Math.round((currentBalance / globalTarget) * 100), 100) : 0;

   const formatMoney = (val) => `$${Number(val || 0).toLocaleString('es-UY')}`;

   const formatDateShort = (ts) => {
      if (!ts) return '—';
      try {
         const d = new Date(ts);
         if (isNaN(d.getTime())) return '—';
         return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' });
      } catch (e) {
         return '—';
      }
   };

   const pieData = [
      { name: 'Cuotas Puras', value: metrics.totalFees },
      { name: 'Rifas (Fondo)', value: metrics.commonFundRaffles },
      { name: 'Extras (Ingresos)', value: metrics.manualIncome },
   ].filter(d => d.value > 0);

   return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

         {/* HEADER */}
         <div className="glass-panel fade-in-up" style={{ padding: '1.75rem 2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
               <h1 style={{ marginBottom: '0.35rem', marginTop: 0 }}>Centro de comando operativo</h1>
               <p className="text-muted" style={{ margin: 0 }}>Análisis de recaudación, salud financiera y proyecciones</p>
            </div>
            {/* Sutil gradiente de fondo en el header */}
            <div style={{
               position: 'absolute', top: '-50%', right: '-10%',
               width: '300px', height: '300px',
               background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
               opacity: 0.15, pointerEvents: 'none'
            }} />
         </div>

         {/* KPI GRID PRIMARY */}
         <div className="grid-kpi-primary">

            {/* 1. Meta Global y Progreso */}
            <div className="glass-panel fade-in-up stagger-1" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', height: '100%' }}>
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p style={{ margin: '0 0 0.75rem 0', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Meta Graduación 2026</p>
                     <h2 style={{ margin: 0, fontSize: '2.2rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700, lineHeight: 1 }}>{formatMoney(currentBalance)}</h2>
                     <p className="text-muted" style={{ fontSize: '0.92rem', marginTop: '0.65rem', fontWeight: 500 }}>de {formatMoney(globalTarget)} objetivo</p>
                  </div>
                  <div style={{ background: 'var(--accent-light)', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexShrink: 0 }}>
                     <Target size={22} color="var(--accent-primary)" />
                  </div>
               </div>
               <div style={{ marginTop: 'auto' }}>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                     <div style={{
                        width: `${progressPercent}%`, height: '100%',
                        background: 'linear-gradient(90deg, var(--accent-primary), #60A5FA)',
                        boxShadow: '0 0 15px var(--accent-glow)',
                        transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                     }} />
                  </div>
                  <div className="flex justify-between items-center">
                     <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{progressPercent}% completado</span>
                     <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Faltan {formatMoney(globalTarget - currentBalance)}</span>
                  </div>
               </div>
            </div>

            {/* 2. Salud de Cobranza (Morosos vs Al día) */}
            <div className="glass-panel fade-in-up stagger-2" style={{ padding: '2rem', borderLeft: '4px solid #F59E0B', display: 'flex', flexDirection: 'column', height: '100%' }}>
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p style={{ margin: '0 0 0.75rem 0', color: '#F59E0B', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Salud de Cobranza</p>
                     <h2 style={{ margin: 0, fontSize: '2.2rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700, lineHeight: 1 }}>{uptodateCount}<span style={{ fontSize: '1.5rem', opacity: 0.4, fontWeight: 400, marginLeft: '4px' }}>/ {activeStudents}</span></h2>
                     <p className="text-muted" style={{ fontSize: '0.92rem', marginTop: '0.65rem', fontWeight: 500 }}>Estudiantes al día</p>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.12)', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexShrink: 0 }}>
                     <Activity size={22} color="#F59E0B" />
                  </div>
               </div>
               <div className="flex flex-wrap gap-3 items-center" style={{ marginTop: 'auto' }}>
                  <div style={{
                     padding: '5px 12px', borderRadius: '10px',
                     background: delinquentCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                     color: delinquentCount > 0 ? '#FB7185' : 'var(--color-success)',
                     fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                     {delinquentCount > 0 ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
                     {delinquentCount} moroso(s) críticos
                  </div>
                  <span className="text-muted" style={{ padding: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>{activeStudents > 0 ? Math.round((uptodateCount / activeStudents) * 100) : 0}% efectividad</span>
               </div>
            </div>

            {/* 3. Último Movimiento */}
            <div className="glass-panel fade-in-up stagger-3" style={{ padding: '2rem', borderLeft: '4px solid #10B981', display: 'flex', flexDirection: 'column', height: '100%' }}>
               <div className="flex justify-between items-start mb-5">
                  <div>
                     <p style={{ margin: '0 0 0.75rem 0', color: '#10B981', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Último Ingreso</p>
                     <h2 style={{ margin: 0, fontSize: '2.1rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700, color: '#10B981', lineHeight: 1 }}>+ {formatMoney(lastIncome.val)}</h2>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexShrink: 0 }}>
                     <TrendingUp size={22} color="#10B981" />
                  </div>
               </div>
               <div style={{ marginTop: 'auto' }}>
                  <div className="text-main" style={{ fontSize: '0.95rem', marginBottom: '0.75rem', lineHeight: '1.5', fontWeight: 500 }}>
                     <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{formatDateShort(lastIncome.dt)}</span> <span style={{ opacity: 0.6 }}>—</span> {lastIncome.descrip}
                  </div>
               </div>
            </div>

         </div>

         {/* KPI GRID SECONDARY */}
         <div className="grid-kpi-secondary">

            <div className="glass-panel fade-in-up stagger-4" style={{ padding: '1.75rem' }}>
               <div className="flex items-center mb-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.12)', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', flexShrink: 0 }}>
                     <Ticket size={18} color="var(--accent-primary)" />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Rifas Vendidas</p>
               </div>
               <div className="flex items-end" style={{ gap: '0.6rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.9rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{totalSoldRaffles}</h2>
                  <div style={{ marginBottom: '6px', fontSize: '0.72rem', lineHeight: 1, color: '#10B981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', padding: '3px 7px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                     +{monthlySoldRaffles} este mes
                  </div>
               </div>
            </div>

            <div className="glass-panel fade-in-up stagger-5" style={{ padding: '1.75rem' }}>
               <div className="flex items-center mb-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.12)', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', flexShrink: 0 }}>
                     <Trophy size={18} color="#8B5CF6" />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Fondo Común</p>
               </div>
               <h2 style={{ margin: 0, fontSize: '1.9rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{formatMoney(metrics.commonFundRaffles)}</h2>
            </div>

            <div className="glass-panel fade-in-up stagger-6" style={{ padding: '1.75rem' }}>
               <div className="flex items-center mb-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.12)', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', flexShrink: 0 }}>
                     <DollarSign size={18} color="var(--color-purple)" />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Balance Proyectado</p>
               </div>
               <h2 style={{ margin: 0, fontSize: '1.9rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700, color: projectedBalance >= globalTarget ? 'var(--color-success)' : 'var(--color-purple)' }}>
                  {formatMoney(projectedBalance)}
               </h2>
               <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: 500 }}>si todos pagan al día</p>
            </div>

            <div className="glass-panel fade-in-up stagger-6" style={{ padding: '1.75rem' }}>
               <div className="flex items-center mb-4" style={{ gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(244, 63, 94, 0.12)', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', flexShrink: 0 }}>
                     <AlertTriangle size={18} color="#F43F5E" />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Dinero de cuotas por Cobrar (Abril-Diciembre)</p>
               </div>
               <h2 style={{ margin: 0, fontSize: '1.9rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{formatMoney(metrics.totalMissing)}</h2>
            </div>

         </div>

         {/* CHARTS ROW */}
         <div className="grid-charts fade-in-up stagger-2">

            <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
               <h3 style={{ marginTop: 0, marginBottom: '1.75rem', fontSize: '1rem' }}>Recaudación histórica por clase</h3>
               <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={collectionByClass.filter(c => c.collected > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="class_name" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={formatMoney} />
                        <Tooltip
                           cursor={{ fill: 'rgba(59,130,246,0.06)' }}
                           contentStyle={CHART_TOOLTIP_STYLE}
                           itemStyle={{ color: '#93C5FD' }}
                           formatter={(value) => formatMoney(value)}
                        />
                        <Bar dataKey="collected" name="Recaudado" radius={[5, 5, 0, 0]}>
                           {collectionByClass.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
               <h3 style={{ marginTop: 0, marginBottom: '1.75rem', fontSize: '1rem' }}>Composición de ingresos ($)</h3>
               <div style={{ height: '280px' }}>
                  {pieData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Tooltip
                              contentStyle={CHART_TOOLTIP_STYLE}
                              itemStyle={{ color: '#93C5FD' }}
                              formatter={(value) => formatMoney(value)}
                           />
                           <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconType="circle"
                              wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
                           />
                           <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={110}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                           >
                              {pieData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  ) : (
                     <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <p className="text-muted">Consigue ingresos primero para armar la gráfica.</p>
                     </div>
                  )}
               </div>
            </div>

         </div>

         {/* WIDGETS ROW */}
         <div className="grid-widgets fade-in-up stagger-3">

            <div className="glass-panel" style={{ padding: '1.75rem 2rem', borderTop: '3px solid var(--color-error)' }}>
               <h3 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={17} color="var(--color-error)" />
                  Alerta de morosos críticos
               </h3>
               {defaulters.length === 0 ? (
                  <p className="text-muted">Nadie debe cuotas configuradas</p>
               ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                     {defaulters.map((st, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i !== defaulters.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                           <div>
                              <div style={{ fontWeight: '500' }}>{st.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.82rem' }}>{st.class_name}</div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>{st.pending_months}</span>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>debe mes</div>
                           </div>
                        </li>
                     ))}
                  </ul>
               )}
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem 2rem', borderTop: '3px solid var(--accent-primary)' }}>
               <h3 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={17} color="var(--accent-primary)" />
                  Salón de la Fama: Rifas
               </h3>
               {topSellers.length === 0 ? (
                  <p className="text-muted">Aún nadie rindió rifas vendidas.</p>
               ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                     {topSellers.map((st, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i !== topSellers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                           <div>
                              <div style={{ fontWeight: '500' }}>{i + 1}. {st.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.82rem' }}>{st.class_name}</div>
                           </div>
                           <div style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.88rem', display: 'flex', alignItems: 'center' }}>
                              {st.sold}
                           </div>
                        </li>
                     ))}
                  </ul>
               )}
            </div>

         </div>

      </div>
   );
};

export default DashboardSection;
