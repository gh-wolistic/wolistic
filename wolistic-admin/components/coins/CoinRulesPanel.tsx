"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoinRuleEditor } from "./CoinRuleEditor";
import { adminApi } from "@/lib/admin-api-client";
import type { CoinRule } from "@/types/admin";

export function CoinRulesPanel() {
  const [rules, setRules] = useState<CoinRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<CoinRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    void loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await adminApi.coins.listRules();
      setRules(data);
    } catch (err) {
      console.error("Failed to load coin rules:", err);
      setError(err instanceof Error ? err.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  const handleEdit = (rule: CoinRule) => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleDelete = async (eventType: string) => {
    if (!confirm("Are you sure you want to delete this coin rule?")) {
      return;
    }

    try {
      await adminApi.coins.deleteRule(eventType);
      setRules((prev) => prev.filter((r) => r.event_type !== eventType));
    } catch (err) {
      console.error("Failed to delete rule:", err);
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const handleToggleActive = async (rule: CoinRule) => {
    try {
      const updated = await adminApi.coins.updateRule(rule.event_type, {
        is_active: !rule.is_active,
      });
      setRules((prev) => prev.map((r) => (r.event_type === rule.event_type ? updated : r)));
    } catch (err) {
      console.error("Failed to toggle rule:", err);
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  const handleSave = async (data: Partial<CoinRule>) => {
    try {
      if (editingRule) {
        // Update existing
        const updated = await adminApi.coins.updateRule(editingRule.event_type, data);
        setRules((prev) => prev.map((r) => (r.event_type === editingRule.event_type ? updated : r)));
      } else {
        // Create new
        const created = await adminApi.coins.createRule(data);
        setRules((prev) => [...prev, created]);
      }
      setShowEditor(false);
      setEditingRule(null);
    } catch (err) {
      console.error("Failed to save rule:", err);
      throw err; // Re-throw to let editor handle it
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Coin Rules</h2>
          <p className="mt-1 text-sm text-slate-400">
            Define how coins are earned and spent across the platform
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rules Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-slate-300">Event Type</TableHead>
              <TableHead className="text-slate-300">Coins Awarded</TableHead>
              <TableHead className="text-slate-300">Max Per User</TableHead>
              <TableHead className="text-slate-300">Cooldown</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <span className="text-slate-400">Loading rules...</span>
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <span className="text-slate-400">No coin rules defined. Click "New Rule" to create one.</span>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.event_type} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">
                    {rule.event_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <span className="text-emerald-400">
                      +{rule.coins_awarded}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {rule.max_per_user || "Unlimited"}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {rule.cooldown_days ? `${rule.cooldown_days} days` : "None"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(rule)}
                        title={rule.is_active ? "Deactivate" : "Activate"}
                      >
                        {rule.is_active ? (
                          <ToggleRight className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.event_type)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Editor Dialog */}
      <CoinRuleEditor
        open={showEditor}
        onOpenChange={setShowEditor}
        rule={editingRule}
        onSave={handleSave}
      />
    </div>
  );
}
