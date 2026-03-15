import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, CreditCard, Package, Save, ShoppingCart, Trash2, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const categories = ["Ballons", "Maillots", "Plots", "Filets", "Pharmacie", "Autres"];
const teams = ["U7", "U9", "U11", "U13", "U15", "U18", "Seniors"];
const feeDefaultByTeam = { U7: 80, U9: 90, U11: 100, U13: 110, U15: 120, U18: 130, Seniors: 150 };
const pieColors = ["#16a34a", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

const initialData = {
  achats: [
    {
      id: crypto.randomUUID(),
      date: "2026-03-15",
      fournisseur: "Decathlon",
      categorie: "Ballons",
      materiel: "Ballon entraînement",
      quantite: 10,
      prixUnitaire: 15,
      equipe: "U15",
      responsable: "Coach Martin",
      commentaire: "Nouveau stock",
    },
  ],
  stock: [
    { id: crypto.randomUUID(), materiel: "Ballon entraînement", categorie: "Ballons", stockInitial: 20, entrees: 10, sorties: 4 },
    { id: crypto.randomUUID(), materiel: "Plots orange", categorie: "Plots", stockInitial: 30, entrees: 0, sorties: 6 },
  ],
  licences: [
    { id: crypto.randomUUID(), nom: "Dupont", prenom: "Lucas", naissance: "2012-05-10", equipe: "U15", licence: "FFF-45821", telephone: "", email: "", cotisationPayee: 60 },
  ],
  cotisations: [
    { id: crypto.randomUUID(), joueur: "Lucas Dupont", equipe: "U15", montantDu: 120, montantPaye: 60, datePaiement: "2026-03-01" },
  ],
  planning: [
    { id: crypto.randomUUID(), date: "2026-03-20", type: "Match", equipe: "U15", adversaire: "FC Rivière", lieu: "Domicile", heure: "15:00", responsable: "Coach Martin", notes: "Prévoir chasubles" },
  ],
  budget: categories.map((c) => ({ id: crypto.randomUUID(), categorie: c, budgetPrevu: c === "Ballons" ? 800 : 500 })),
  equipements: [
    { id: crypto.randomUUID(), joueur: "Lucas Dupont", equipe: "U15", equipement: "Maillot domicile", taille: "M", numero: "9", statut: "Attribué" },
  ],
};

function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <Card className="summary-card">
      <div className="summary-title">{title}</div>
      <div className="summary-value">{value}</div>
      <div className="summary-subtitle">{subtitle}</div>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="section-title">
      <div className="section-title-row">
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      <p>{subtitle}</p>
    </div>
  );
}

function TableWrap({ children }) {
  return <div className="table-wrap">{children}</div>;
}

function DataTable({ columns, rows, renderRow }) {
  return (
    <TableWrap>
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="empty">Aucune donnée</td></tr>
          ) : rows.map(renderRow)}
        </tbody>
      </table>
    </TableWrap>
  );
}

export default function App() {
  const [data, setData] = usePersistentState("club-foot-vercel-app", initialData);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");

  const totalAchats = useMemo(() => data.achats.reduce((sum, a) => sum + Number(a.quantite || 0) * Number(a.prixUnitaire || 0), 0), [data.achats]);
  const totalCotisationsDues = useMemo(() => data.cotisations.reduce((sum, c) => sum + Number(c.montantDu || 0), 0), [data.cotisations]);
  const totalCotisationsPayees = useMemo(() => data.cotisations.reduce((sum, c) => sum + Number(c.montantPaye || 0), 0), [data.cotisations]);

  const budgetOverview = useMemo(() => data.budget.map((b) => {
    const depenses = data.achats
      .filter((a) => a.categorie === b.categorie)
      .reduce((sum, a) => sum + Number(a.quantite || 0) * Number(a.prixUnitaire || 0), 0);
    return { ...b, depenses, reste: Number(b.budgetPrevu || 0) - depenses };
  }), [data.budget, data.achats]);

  const stockOverview = useMemo(() => data.stock.map((s) => ({
    ...s,
    stockActuel: Number(s.stockInitial || 0) + Number(s.entrees || 0) - Number(s.sorties || 0),
  })), [data.stock]);

  const dashboardBar = budgetOverview.map((b) => ({ name: b.categorie, budget: b.budgetPrevu, depense: b.depenses }));
  const dashboardPie = budgetOverview.filter((b) => b.depenses > 0).map((b) => ({ name: b.categorie, value: b.depenses }));

  const filteredAchats = data.achats.filter((a) => {
    const blob = `${a.fournisseur} ${a.categorie} ${a.materiel} ${a.equipe} ${a.responsable}`.toLowerCase();
    return blob.includes(search.toLowerCase());
  });

  const addRow = (section, row) => setData((prev) => ({ ...prev, [section]: [row, ...prev[section]] }));
  const removeRow = (section, id) => setData((prev) => ({ ...prev, [section]: prev[section].filter((x) => x.id !== id) }));
  const updateRow = (section, id, field, value) => setData((prev) => ({
    ...prev,
    [section]: prev[section].map((x) => (x.id === id ? { ...x, [field]: value } : x)),
  }));

  const tabs = [
    ["dashboard", "Tableau de bord"],
    ["achats", "Achats"],
    ["budget", "Budget"],
    ["stock", "Stock"],
    ["licences", "Licences"],
    ["cotisations", "Cotisations"],
    ["equipements", "Équipements"],
    ["planning", "Planning"],
  ];

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <div>
            <h1>Logiciel de gestion club de football</h1>
            <p>Achats, budget, stock, licences, cotisations, équipements et planning dans une seule interface.</p>
          </div>
          <div className="save-chip"><Save size={16} /> Sauvegarde locale automatique</div>
        </header>

        <section className="summary-grid">
          <SummaryCard title="Dépenses matériel" value={formatCurrency(totalAchats)} subtitle="Total des achats enregistrés" />
          <SummaryCard title="Cotisations payées" value={formatCurrency(totalCotisationsPayees)} subtitle={`Sur ${formatCurrency(totalCotisationsDues)}`} />
          <SummaryCard title="Joueurs licenciés" value={data.licences.length} subtitle="Licences enregistrées" />
          <SummaryCard title="Articles en stock" value={stockOverview.length} subtitle="Lignes de stock suivies" />
        </section>

        <nav className="tabs">
          {tabs.map(([key, label]) => (
            <button key={key} className={tab === key ? "tab active" : "tab"} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "dashboard" && (
          <section className="page">
            <SectionTitle icon={BarChart3} title="Tableau de bord" subtitle="Vue d'ensemble du club et des dépenses matérielles." />
            <div className="chart-grid">
              <Card>
                <h3>Budget vs dépenses</h3>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardBar}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="budget" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="depense" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <h3>Répartition des achats</h3>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboardPie} dataKey="value" nameKey="name" outerRadius={110} label>
                        {dashboardPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            <Card>
              <h3>Alertes rapides</h3>
              <div className="badge-list">
                {budgetOverview.filter((b) => b.reste < 0).length === 0 && <span className="badge">Aucun dépassement budget</span>}
                {budgetOverview.filter((b) => b.reste < 0).map((b) => <span key={b.id} className="badge danger">Budget dépassé : {b.categorie}</span>)}
                {stockOverview.filter((s) => s.stockActuel <= 5).map((s) => <span key={s.id} className="badge warning">Stock faible : {s.materiel}</span>)}
                {data.cotisations.filter((c) => Number(c.montantPaye || 0) < Number(c.montantDu || 0)).slice(0, 3).map((c) => <span key={c.id} className="badge info">Reste à payer : {c.joueur}</span>)}
              </div>
            </Card>
          </section>
        )}

        {tab === "achats" && (
          <section className="page">
            <div className="section-top">
              <SectionTitle icon={ShoppingCart} title="Suivi des achats" subtitle="Ajoutez et filtrez les achats de matériel du club." />
              <input className="input" placeholder="Rechercher un achat..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <AchatForm onAdd={(row) => addRow("achats", row)} />
            <DataTable
              columns={["Date", "Fournisseur", "Catégorie", "Matériel", "Qté", "PU", "Total", "Équipe", "Action"]}
              rows={filteredAchats}
              renderRow={(a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.fournisseur}</td>
                  <td>{a.categorie}</td>
                  <td>{a.materiel}</td>
                  <td>{a.quantite}</td>
                  <td>{formatCurrency(a.prixUnitaire)}</td>
                  <td>{formatCurrency(Number(a.quantite) * Number(a.prixUnitaire))}</td>
                  <td>{a.equipe}</td>
                  <td><button className="icon-btn" onClick={() => removeRow("achats", a.id)}><Trash2 size={16} /></button></td>
                </tr>
              )}
            />
          </section>
        )}

        {tab === "budget" && (
          <section className="page">
            <SectionTitle icon={CreditCard} title="Budget annuel" subtitle="Suivi du budget prévu, des dépenses et du reste par catégorie." />
            <DataTable
              columns={["Catégorie", "Budget prévu", "Dépenses", "Reste"]}
              rows={budgetOverview}
              renderRow={(b) => (
                <tr key={b.id}>
                  <td>{b.categorie}</td>
                  <td><input className="input small" type="number" value={b.budgetPrevu} onChange={(e) => updateRow("budget", b.id, "budgetPrevu", Number(e.target.value))} /></td>
                  <td>{formatCurrency(b.depenses)}</td>
                  <td className={b.reste < 0 ? "danger-text" : "success-text"}>{formatCurrency(b.reste)}</td>
                </tr>
              )}
            />
          </section>
        )}

        {tab === "stock" && (
          <section className="page">
            <SectionTitle icon={Package} title="Stock matériel" subtitle="Contrôlez le stock initial, les entrées, les sorties et le stock actuel." />
            <StockForm onAdd={(row) => addRow("stock", row)} />
            <DataTable
              columns={["Matériel", "Catégorie", "Initial", "Entrées", "Sorties", "Actuel", "Action"]}
              rows={stockOverview}
              renderRow={(s) => (
                <tr key={s.id}>
                  <td>{s.materiel}</td>
                  <td>{s.categorie}</td>
                  <td>{s.stockInitial}</td>
                  <td>{s.entrees}</td>
                  <td>{s.sorties}</td>
                  <td className={s.stockActuel <= 5 ? "danger-text" : ""}>{s.stockActuel}</td>
                  <td><button className="icon-btn" onClick={() => removeRow("stock", s.id)}><Trash2 size={16} /></button></td>
                </tr>
              )}
            />
          </section>
        )}

        {tab === "licences" && (
          <section className="page">
            <SectionTitle icon={Users} title="Licences joueurs" subtitle="Fiche joueur avec équipe, numéro de licence et coordonnées." />
            <LicenceForm onAdd={(row) => {
              addRow("licences", row);
              addRow("cotisations", {
                id: crypto.randomUUID(),
                joueur: `${row.prenom} ${row.nom}`,
                equipe: row.equipe,
                montantDu: feeDefaultByTeam[row.equipe] || 100,
                montantPaye: Number(row.cotisationPayee || 0),
                datePaiement: "",
              });
            }} />
            <DataTable
              columns={["Nom", "Prénom", "Naissance", "Équipe", "Licence", "Cotisation payée", "Action"]}
              rows={data.licences}
              renderRow={(j) => (
                <tr key={j.id}>
                  <td>{j.nom}</td>
                  <td>{j.prenom}</td>
                  <td>{j.naissance}</td>
                  <td>{j.equipe}</td>
                  <td>{j.licence}</td>
                  <td>{formatCurrency(j.cotisationPayee)}</td>
                  <td><button className="icon-btn" onClick={() => removeRow("licences", j.id)}><Trash2 size={16} /></button></td>
                </tr>
              )}
            />
          </section>
        )}

        {tab === "cotisations" && (
          <section className="page">
            <SectionTitle icon={CreditCard} title="Cotisations" subtitle="Visualisez les montants dus, payés et le reste à régler." />
            <DataTable
              columns={["Joueur", "Équipe", "Montant dû", "Montant payé", "Reste", "Date paiement"]}
              rows={data.cotisations}
              renderRow={(c) => {
                const reste = Number(c.montantDu || 0) - Number(c.montantPaye || 0);
                return (
                  <tr key={c.id}>
                    <td>{c.joueur}</td>
                    <td>{c.equipe}</td>
                    <td>{formatCurrency(c.montantDu)}</td>
                    <td><input className="input small" type="number" value={c.montantPaye} onChange={(e) => updateRow("cotisations", c.id, "montantPaye", Number(e.target.value))} /></td>
                    <td className={reste > 0 ? "danger-text" : "success-text"}>{formatCurrency(reste)}</td>
                    <td><input className="input small" type="date" value={c.datePaiement} onChange={(e) => updateRow("cotisations", c.id, "datePaiement", e.target.value)} /></td>
                  </tr>
                );
              }}
            />
          </section>
        )}

        {tab === "equipements" && (
          <section className="page">
            <SectionTitle icon={Package} title="Équipements joueurs" subtitle="Attribution du matériel par joueur : maillots, shorts, survêtements, etc." />
            <EquipementForm onAdd={(row) => addRow("equipements", row)} joueurs={data.licences} />
            <DataTable
              columns={["Joueur", "Équipe", "Équipement", "Taille", "Numéro", "Statut", "Action"]}
              rows={data.equipements}
              renderRow={(e) => (
                <tr key={e.id}>
                  <td>{e.joueur}</td>
                  <td>{e.equipe}</td>
                  <td>{e.equipement}</td>
                  <td>{e.taille}</td>
                  <td>{e.numero}</td>
                  <td><span className="badge">{e.statut}</span></td>
                  <td><button className="icon-btn" onClick={() => removeRow("equipements", e.id)}><Trash2 size={16} /></button></td>
                </tr>
              )}
            />
          </section>
        )}

        {tab === "planning" && (
          <section className="page">
            <SectionTitle icon={CalendarDays} title="Planning sportif" subtitle="Matchs et entraînements par équipe." />
            <PlanningForm onAdd={(row) => addRow("planning", row)} />
            <DataTable
              columns={["Date", "Type", "Équipe", "Adversaire", "Lieu", "Heure", "Responsable", "Action"]}
              rows={data.planning}
              renderRow={(p) => (
                <tr key={p.id}>
                  <td>{p.date}</td>
                  <td>{p.type}</td>
                  <td>{p.equipe}</td>
                  <td>{p.adversaire}</td>
                  <td>{p.lieu}</td>
                  <td>{p.heure}</td>
                  <td>{p.responsable}</td>
                  <td><button className="icon-btn" onClick={() => removeRow("planning", p.id)}><Trash2 size={16} /></button></td>
                </tr>
              )}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function AchatForm({ onAdd }) {
  const [form, setForm] = useState({ date: "", fournisseur: "", categorie: "Ballons", materiel: "", quantite: 1, prixUnitaire: 0, equipe: "U7", responsable: "", commentaire: "" });
  return (
    <Card className="form-card">
      <div className="form-grid five">
        <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="input" placeholder="Fournisseur" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} />
        <select className="input" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="input" placeholder="Matériel" value={form.materiel} onChange={(e) => setForm({ ...form, materiel: e.target.value })} />
        <input className="input" type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Prix unitaire" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: Number(e.target.value) })} />
        <select className="input" value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })}>{teams.map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input" placeholder="Responsable" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        <input className="input" placeholder="Commentaire" value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
        <button className="btn" onClick={() => {
          if (!form.date || !form.materiel) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ date: "", fournisseur: "", categorie: "Ballons", materiel: "", quantite: 1, prixUnitaire: 0, equipe: "U7", responsable: "", commentaire: "" });
        }}>Ajouter</button>
      </div>
    </Card>
  );
}

function StockForm({ onAdd }) {
  const [form, setForm] = useState({ materiel: "", categorie: "Ballons", stockInitial: 0, entrees: 0, sorties: 0 });
  return (
    <Card className="form-card">
      <div className="form-grid six">
        <input className="input" placeholder="Matériel" value={form.materiel} onChange={(e) => setForm({ ...form, materiel: e.target.value })} />
        <select className="input" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="input" type="number" placeholder="Stock initial" value={form.stockInitial} onChange={(e) => setForm({ ...form, stockInitial: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Entrées" value={form.entrees} onChange={(e) => setForm({ ...form, entrees: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="Sorties" value={form.sorties} onChange={(e) => setForm({ ...form, sorties: Number(e.target.value) })} />
        <button className="btn" onClick={() => {
          if (!form.materiel) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ materiel: "", categorie: "Ballons", stockInitial: 0, entrees: 0, sorties: 0 });
        }}>Ajouter</button>
      </div>
    </Card>
  );
}

function LicenceForm({ onAdd }) {
  const [form, setForm] = useState({ nom: "", prenom: "", naissance: "", equipe: "U7", licence: "", telephone: "", email: "", cotisationPayee: 0 });
  return (
    <Card className="form-card">
      <div className="form-grid five">
        <input className="input" placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <input className="input" placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        <input className="input" type="date" value={form.naissance} onChange={(e) => setForm({ ...form, naissance: e.target.value })} />
        <select className="input" value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })}>{teams.map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input" placeholder="Numéro licence" value={form.licence} onChange={(e) => setForm({ ...form, licence: e.target.value })} />
        <input className="input" placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="number" placeholder="Cotisation déjà payée" value={form.cotisationPayee} onChange={(e) => setForm({ ...form, cotisationPayee: Number(e.target.value) })} />
        <button className="btn" onClick={() => {
          if (!form.nom || !form.prenom) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ nom: "", prenom: "", naissance: "", equipe: "U7", licence: "", telephone: "", email: "", cotisationPayee: 0 });
        }}>Ajouter joueur</button>
      </div>
    </Card>
  );
}

function EquipementForm({ onAdd, joueurs }) {
  const [form, setForm] = useState({ joueur: "", equipe: "U7", equipement: "Maillot", taille: "M", numero: "", statut: "Attribué" });
  return (
    <Card className="form-card">
      <div className="form-grid six">
        <select className="input" value={form.joueur} onChange={(e) => {
          const v = e.target.value;
          const joueur = joueurs.find((j) => `${j.prenom} ${j.nom}` === v);
          setForm({ ...form, joueur: v, equipe: joueur?.equipe || "U7" });
        }}>
          <option value="">Joueur</option>
          {joueurs.map((j) => <option key={j.id} value={`${j.prenom} ${j.nom}`}>{j.prenom} {j.nom}</option>)}
        </select>
        <input className="input" placeholder="Équipement" value={form.equipement} onChange={(e) => setForm({ ...form, equipement: e.target.value })} />
        <input className="input" placeholder="Taille" value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} />
        <input className="input" placeholder="Numéro" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
        <select className="input" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
          <option>Attribué</option>
          <option>À rendre</option>
          <option>Restitué</option>
        </select>
        <button className="btn" onClick={() => {
          if (!form.joueur || !form.equipement) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ joueur: "", equipe: "U7", equipement: "Maillot", taille: "M", numero: "", statut: "Attribué" });
        }}>Ajouter</button>
      </div>
    </Card>
  );
}

function PlanningForm({ onAdd }) {
  const [form, setForm] = useState({ date: "", type: "Match", equipe: "U7", adversaire: "", lieu: "", heure: "", responsable: "", notes: "" });
  return (
    <Card className="form-card">
      <div className="form-grid five">
        <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option>Match</option>
          <option>Entraînement</option>
        </select>
        <select className="input" value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })}>{teams.map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input" placeholder="Adversaire" value={form.adversaire} onChange={(e) => setForm({ ...form, adversaire: e.target.value })} />
        <input className="input" placeholder="Lieu" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
        <input className="input" type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} />
        <input className="input" placeholder="Responsable" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        <input className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="btn" onClick={() => {
          if (!form.date) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ date: "", type: "Match", equipe: "U7", adversaire: "", lieu: "", heure: "", responsable: "", notes: "" });
        }}>Ajouter</button>
      </div>
    </Card>
  );
}
