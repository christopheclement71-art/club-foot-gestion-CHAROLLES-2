import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Package, Wallet, Users, CalendarDays, ShoppingCart, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const categories = ["Ballons", "Maillots", "Plots", "Filets", "Pharmacie", "Autres"];
const teams = ["U7", "U9", "U11", "U13", "U15", "U18", "Seniors"];
const feeDefaultByTeam = {
  U7: 80,
  U9: 90,
  U11: 100,
  U13: 110,
  U15: 120,
  U18: 130,
  Seniors: 150,
};

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

function Currency({ value }) {
  return <span>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value || 0))}</span>;
}

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function ClubFootLogicielGestion() {
  const [data, setData] = usePersistentState("club-foot-logiciel-gestion", initialData);
  const [search, setSearch] = useState("");

  const totalAchats = useMemo(
    () => data.achats.reduce((sum, a) => sum + Number(a.quantite || 0) * Number(a.prixUnitaire || 0), 0),
    [data.achats]
  );

  const totalCotisationsDues = useMemo(
    () => data.cotisations.reduce((sum, c) => sum + Number(c.montantDu || 0), 0),
    [data.cotisations]
  );

  const totalCotisationsPayees = useMemo(
    () => data.cotisations.reduce((sum, c) => sum + Number(c.montantPaye || 0), 0),
    [data.cotisations]
  );

  const joueursCount = data.licences.length;

  const budgetOverview = useMemo(() => {
    return data.budget.map((b) => {
      const depenses = data.achats
        .filter((a) => a.categorie === b.categorie)
        .reduce((sum, a) => sum + Number(a.quantite || 0) * Number(a.prixUnitaire || 0), 0);
      return {
        ...b,
        depenses,
        reste: Number(b.budgetPrevu || 0) - depenses,
      };
    });
  }, [data.budget, data.achats]);

  const stockOverview = useMemo(() => {
    return data.stock.map((s) => ({
      ...s,
      stockActuel: Number(s.stockInitial || 0) + Number(s.entrees || 0) - Number(s.sorties || 0),
    }));
  }, [data.stock]);

  const dashboardBar = budgetOverview.map((b) => ({ name: b.categorie, budget: b.budgetPrevu, dépensé: b.depenses }));
  const dashboardPie = budgetOverview.filter((b) => b.depenses > 0).map((b) => ({ name: b.categorie, value: b.depenses }));
  const pieColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

  const filteredAchats = data.achats.filter((a) => {
    const blob = `${a.fournisseur} ${a.categorie} ${a.materiel} ${a.equipe} ${a.responsable}`.toLowerCase();
    return blob.includes(search.toLowerCase());
  });

  const addRow = (section, row) => setData((prev) => ({ ...prev, [section]: [row, ...prev[section]] }));
  const removeRow = (section, id) => setData((prev) => ({ ...prev, [section]: prev[section].filter((x) => x.id !== id) }));
  const updateRow = (section, id, field, value) =>
    setData((prev) => ({
      ...prev,
      [section]: prev[section].map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="rounded-3xl shadow-sm border-0 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Logiciel de gestion club de football</h1>
                <p className="text-white/85 mt-2">Achats, budget, stock, licences, cotisations, équipements et planning dans une seule interface.</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm">
                <Save className="h-4 w-4" />
                Sauvegarde locale automatique
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard title="Dépenses matériel" value={<Currency value={totalAchats} />} subtitle="Total des achats enregistrés" />
          <SummaryCard title="Cotisations payées" value={<Currency value={totalCotisationsPayees} />} subtitle={`Sur ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalCotisationsDues)}`} />
          <SummaryCard title="Joueurs licenciés" value={joueursCount} subtitle="Licences enregistrées" />
          <SummaryCard title="Articles en stock" value={stockOverview.length} subtitle="Lignes de stock suivies" />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-8 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="dashboard" className="rounded-2xl border bg-white">Tableau de bord</TabsTrigger>
            <TabsTrigger value="achats" className="rounded-2xl border bg-white">Achats</TabsTrigger>
            <TabsTrigger value="budget" className="rounded-2xl border bg-white">Budget</TabsTrigger>
            <TabsTrigger value="stock" className="rounded-2xl border bg-white">Stock</TabsTrigger>
            <TabsTrigger value="licences" className="rounded-2xl border bg-white">Licences</TabsTrigger>
            <TabsTrigger value="cotisations" className="rounded-2xl border bg-white">Cotisations</TabsTrigger>
            <TabsTrigger value="equipements" className="rounded-2xl border bg-white">Équipements</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-2xl border bg-white">Planning</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SectionHeader icon={Wallet} title="Tableau de bord" subtitle="Vue d'ensemble du club et des dépenses matérielles." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Budget vs dépenses</CardTitle></CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardBar}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="budget" radius={[8,8,0,0]} />
                      <Bar dataKey="dépensé" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>Répartition des achats</CardTitle></CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboardPie} dataKey="value" nameKey="name" outerRadius={110} label>
                        {dashboardPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>Alertes rapides</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-3">
                {budgetOverview.filter((b) => b.reste < 0).length === 0 ? (
                  <Badge className="w-fit rounded-xl px-3 py-2">Aucun dépassement budget</Badge>
                ) : budgetOverview.filter((b) => b.reste < 0).map((b) => (
                  <Badge key={b.id} variant="destructive" className="w-fit rounded-xl px-3 py-2">Budget dépassé : {b.categorie}</Badge>
                ))}
                {stockOverview.filter((s) => s.stockActuel <= 5).map((s) => (
                  <Badge key={s.id} className="w-fit rounded-xl px-3 py-2 bg-amber-500 hover:bg-amber-500">Stock faible : {s.materiel}</Badge>
                ))}
                {data.cotisations.filter((c) => Number(c.montantPaye || 0) < Number(c.montantDu || 0)).slice(0, 3).map((c) => (
                  <Badge key={c.id} className="w-fit rounded-xl px-3 py-2 bg-blue-600 hover:bg-blue-600">Reste à payer : {c.joueur}</Badge>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achats" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader
                  icon={ShoppingCart}
                  title="Suivi des achats"
                  subtitle="Ajoutez et filtrez les achats de matériel du club."
                  action={<Input placeholder="Rechercher un achat..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-72" />}
                />
                <AchatForm onAdd={(row) => addRow("achats", row)} />
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Fournisseur</TableHead><TableHead>Catégorie</TableHead><TableHead>Matériel</TableHead><TableHead>Qté</TableHead><TableHead>PU</TableHead><TableHead>Total</TableHead><TableHead>Équipe</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAchats.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.fournisseur}</TableCell>
                        <TableCell>{a.categorie}</TableCell>
                        <TableCell>{a.materiel}</TableCell>
                        <TableCell>{a.quantite}</TableCell>
                        <TableCell><Currency value={a.prixUnitaire} /></TableCell>
                        <TableCell><Currency value={Number(a.quantite) * Number(a.prixUnitaire)} /></TableCell>
                        <TableCell>{a.equipe}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow("achats", a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader icon={Wallet} title="Budget annuel" subtitle="Suivi du budget prévu, des dépenses et du reste par catégorie." />
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Catégorie</TableHead><TableHead>Budget prévu</TableHead><TableHead>Dépenses</TableHead><TableHead>Reste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetOverview.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.categorie}</TableCell>
                        <TableCell>
                          <Input type="number" value={b.budgetPrevu} onChange={(e) => updateRow("budget", b.id, "budgetPrevu", Number(e.target.value))} className="w-32" />
                        </TableCell>
                        <TableCell><Currency value={b.depenses} /></TableCell>
                        <TableCell>
                          <span className={b.reste < 0 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                            <Currency value={b.reste} />
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader icon={Package} title="Stock matériel" subtitle="Contrôlez le stock initial, les entrées, les sorties et le stock actuel." />
                <StockForm onAdd={(row) => addRow("stock", row)} />
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matériel</TableHead><TableHead>Catégorie</TableHead><TableHead>Initial</TableHead><TableHead>Entrées</TableHead><TableHead>Sorties</TableHead><TableHead>Actuel</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockOverview.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.materiel}</TableCell>
                        <TableCell>{s.categorie}</TableCell>
                        <TableCell>{s.stockInitial}</TableCell>
                        <TableCell>{s.entrees}</TableCell>
                        <TableCell>{s.sorties}</TableCell>
                        <TableCell>
                          <span className={s.stockActuel <= 5 ? "text-red-600 font-semibold" : "font-semibold"}>{s.stockActuel}</span>
                        </TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow("stock", s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licences" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader icon={Users} title="Licences joueurs" subtitle="Fiche joueur avec équipe, numéro de licence et coordonnées." />
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
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead><TableHead>Prénom</TableHead><TableHead>Naissance</TableHead><TableHead>Équipe</TableHead><TableHead>Licence</TableHead><TableHead>Cotisation payée</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.licences.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell>{j.nom}</TableCell>
                        <TableCell>{j.prenom}</TableCell>
                        <TableCell>{j.naissance}</TableCell>
                        <TableCell>{j.equipe}</TableCell>
                        <TableCell>{j.licence}</TableCell>
                        <TableCell><Currency value={j.cotisationPayee} /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow("licences", j.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cotisations" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader icon={Wallet} title="Cotisations" subtitle="Visualisez les montants dus, payés et le reste à régler." />
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Joueur</TableHead><TableHead>Équipe</TableHead><TableHead>Montant dû</TableHead><TableHead>Montant payé</TableHead><TableHead>Reste</TableHead><TableHead>Date paiement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.cotisations.map((c) => {
                      const reste = Number(c.montantDu || 0) - Number(c.montantPaye || 0);
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{c.joueur}</TableCell>
                          <TableCell>{c.equipe}</TableCell>
                          <TableCell><Currency value={c.montantDu} /></TableCell>
                          <TableCell>
                            <Input type="number" value={c.montantPaye} onChange={(e) => updateRow("cotisations", c.id, "montantPaye", Number(e.target.value))} className="w-32" />
                          </TableCell>
                          <TableCell>
                            <span className={reste > 0 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}><Currency value={reste} /></span>
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={c.datePaiement} onChange={(e) => updateRow("cotisations", c.id, "datePaiement", e.target.value)} className="w-40" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipements" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader icon={Package} title="Équipements joueurs" subtitle="Attribution du matériel par joueur : maillots, shorts, survêtements, etc." />
                <EquipementForm onAdd={(row) => addRow("equipements", row)} joueurs={data.licences} />
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Joueur</TableHead><TableHead>Équipe</TableHead><TableHead>Équipement</TableHead><TableHead>Taille</TableHead><TableHead>Numéro</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equipements.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.joueur}</TableCell>
                        <TableCell>{e.equipe}</TableCell>
                        <TableCell>{e.equipement}</TableCell>
                        <TableCell>{e.taille}</TableCell>
                        <TableCell>{e.numero}</TableCell>
                        <TableCell><Badge className="rounded-xl">{e.statut}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow("equipements", e.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planning" className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6 space-y-4">
                <SectionHeader icon={CalendarDays} title="Planning sportif" subtitle="Matchs et entraînements par équipe." />
                <PlanningForm onAdd={(row) => addRow("planning", row)} />
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Équipe</TableHead><TableHead>Adversaire</TableHead><TableHead>Lieu</TableHead><TableHead>Heure</TableHead><TableHead>Responsable</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.planning.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.date}</TableCell>
                        <TableCell>{p.type}</TableCell>
                        <TableCell>{p.equipe}</TableCell>
                        <TableCell>{p.adversaire}</TableCell>
                        <TableCell>{p.lieu}</TableCell>
                        <TableCell>{p.heure}</TableCell>
                        <TableCell>{p.responsable}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => removeRow("planning", p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DataTable({ children }) {
  return (
    <div className="rounded-2xl border bg-white overflow-x-auto">
      <Table>{children}</Table>
    </div>
  );
}

function AchatForm({ onAdd }) {
  const [form, setForm] = useState({ date: "", fournisseur: "", categorie: "Ballons", materiel: "", quantite: 1, prixUnitaire: 0, equipe: "U7", responsable: "", commentaire: "" });
  return (
    <Card className="rounded-2xl bg-slate-50 border-dashed">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Input placeholder="Fournisseur" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} />
        <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Matériel" value={form.materiel} onChange={(e) => setForm({ ...form, materiel: e.target.value })} />
        <Input type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} />
        <Input type="number" placeholder="Prix unitaire" value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: Number(e.target.value) })} />
        <Select value={form.equipe} onValueChange={(v) => setForm({ ...form, equipe: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Responsable" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        <Input placeholder="Commentaire" value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
        <Button className="rounded-2xl" onClick={() => {
          if (!form.date || !form.materiel) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ date: "", fournisseur: "", categorie: "Ballons", materiel: "", quantite: 1, prixUnitaire: 0, equipe: "U7", responsable: "", commentaire: "" });
        }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </CardContent>
    </Card>
  );
}

function StockForm({ onAdd }) {
  const [form, setForm] = useState({ materiel: "", categorie: "Ballons", stockInitial: 0, entrees: 0, sorties: 0 });
  return (
    <Card className="rounded-2xl bg-slate-50 border-dashed">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <Input placeholder="Matériel" value={form.materiel} onChange={(e) => setForm({ ...form, materiel: e.target.value })} />
        <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="number" placeholder="Stock initial" value={form.stockInitial} onChange={(e) => setForm({ ...form, stockInitial: Number(e.target.value) })} />
        <Input type="number" placeholder="Entrées" value={form.entrees} onChange={(e) => setForm({ ...form, entrees: Number(e.target.value) })} />
        <Input type="number" placeholder="Sorties" value={form.sorties} onChange={(e) => setForm({ ...form, sorties: Number(e.target.value) })} />
        <Button className="rounded-2xl" onClick={() => {
          if (!form.materiel) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ materiel: "", categorie: "Ballons", stockInitial: 0, entrees: 0, sorties: 0 });
        }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </CardContent>
    </Card>
  );
}

function LicenceForm({ onAdd }) {
  const [form, setForm] = useState({ nom: "", prenom: "", naissance: "", equipe: "U7", licence: "", telephone: "", email: "", cotisationPayee: 0 });
  return (
    <Card className="rounded-2xl bg-slate-50 border-dashed">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        <Input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        <Input type="date" value={form.naissance} onChange={(e) => setForm({ ...form, naissance: e.target.value })} />
        <Select value={form.equipe} onValueChange={(v) => setForm({ ...form, equipe: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Numéro licence" value={form.licence} onChange={(e) => setForm({ ...form, licence: e.target.value })} />
        <Input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input type="number" placeholder="Cotisation déjà payée" value={form.cotisationPayee} onChange={(e) => setForm({ ...form, cotisationPayee: Number(e.target.value) })} />
        <Button className="rounded-2xl" onClick={() => {
          if (!form.nom || !form.prenom) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ nom: "", prenom: "", naissance: "", equipe: "U7", licence: "", telephone: "", email: "", cotisationPayee: 0 });
        }}><Plus className="h-4 w-4 mr-2" />Ajouter joueur</Button>
      </CardContent>
    </Card>
  );
}

function EquipementForm({ onAdd, joueurs }) {
  const [form, setForm] = useState({ joueur: "", equipe: "U7", equipement: "Maillot", taille: "M", numero: "", statut: "Attribué" });
  return (
    <Card className="rounded-2xl bg-slate-50 border-dashed">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <Select value={form.joueur} onValueChange={(v) => {
          const joueur = joueurs.find((j) => `${j.prenom} ${j.nom}` === v);
          setForm({ ...form, joueur: v, equipe: joueur?.equipe || "U7" });
        }}>
          <SelectTrigger><SelectValue placeholder="Joueur" /></SelectTrigger>
          <SelectContent>{joueurs.map((j) => <SelectItem key={j.id} value={`${j.prenom} ${j.nom}`}>{j.prenom} {j.nom}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Équipement" value={form.equipement} onChange={(e) => setForm({ ...form, equipement: e.target.value })} />
        <Input placeholder="Taille" value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} />
        <Input placeholder="Numéro" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
        <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Attribué">Attribué</SelectItem>
            <SelectItem value="À rendre">À rendre</SelectItem>
            <SelectItem value="Restitué">Restitué</SelectItem>
          </SelectContent>
        </Select>
        <Button className="rounded-2xl" onClick={() => {
          if (!form.joueur || !form.equipement) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ joueur: "", equipe: "U7", equipement: "Maillot", taille: "M", numero: "", statut: "Attribué" });
        }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </CardContent>
    </Card>
  );
}

function PlanningForm({ onAdd }) {
  const [form, setForm] = useState({ date: "", type: "Match", equipe: "U7", adversaire: "", lieu: "", heure: "", responsable: "", notes: "" });
  return (
    <Card className="rounded-2xl bg-slate-50 border-dashed">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Match">Match</SelectItem>
            <SelectItem value="Entraînement">Entraînement</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.equipe} onValueChange={(v) => setForm({ ...form, equipe: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Adversaire" value={form.adversaire} onChange={(e) => setForm({ ...form, adversaire: e.target.value })} />
        <Input placeholder="Lieu" value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
        <Input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} />
        <Input placeholder="Responsable" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
        <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Button className="rounded-2xl" onClick={() => {
          if (!form.date) return;
          onAdd({ id: crypto.randomUUID(), ...form });
          setForm({ date: "", type: "Match", equipe: "U7", adversaire: "", lieu: "", heure: "", responsable: "", notes: "" });
        }}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
      </CardContent>
    </Card>
  );
}
