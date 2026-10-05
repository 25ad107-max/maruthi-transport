import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { Material, MaterialUnit, MaterialCategory } from '../../types';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Truck,
  Wrench,
  DollarSign
} from 'lucide-react';

export const MaterialManagementView: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useDatabase();
  const { canModifyRates } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'material' | 'service'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('material');
  const [unit, setUnit] = useState<MaterialUnit>('Unit');
  const [sellingRate, setSellingRate] = useState<number>(3500);
  const [costEstimate, setCostEstimate] = useState<number>(2500);
  const [driverDefaultRate, setDriverDefaultRate] = useState<number>(500);
  const [description, setDescription] = useState('');

  const filteredMaterials = materials.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = m.name.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingMatId(null);
    setName('');
    setCategory('material');
    setUnit('Unit');
    setSellingRate(4000);
    setCostEstimate(2800);
    setDriverDefaultRate(500);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMatId(m.id);
    setName(m.name);
    setCategory(m.category);
    setUnit(m.unit);
    setSellingRate(m.selling_rate);
    setCostEstimate(m.cost_estimate);
    setDriverDefaultRate(m.driver_default_rate);
    setDescription(m.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sellingRate <= 0) return;

    if (editingMatId) {
      updateMaterial(editingMatId, {
        name,
        category,
        unit,
        selling_rate: sellingRate,
        cost_estimate: costEstimate,
        driver_default_rate: driverDefaultRate,
        description
      });
    } else {
      addMaterial({
        name,
        category,
        unit,
        selling_rate: sellingRate,
        cost_estimate: costEstimate,
        driver_default_rate: driverDefaultRate,
        description,
        is_active: true
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (m: Material) => {
    updateMaterial(m.id, { is_active: !m.is_active });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Materials & Earth Services Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure market selling rates, procurement costs, driver trip rates, and billing units
          </p>
        </div>

        {canModifyRates() && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + ADD MATERIAL / SERVICE
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search material, stone, service name..."
            className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          {(['all', 'material', 'service'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Items' : cat === 'material' ? 'Materials' : 'Services'}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map(mat => (
          <div
            key={mat.id}
            className={`bg-white rounded-xl border p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between ${
              mat.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      mat.category === 'material'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {mat.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1">{mat.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{mat.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(mat)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded cursor-pointer ${
                    mat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                  title="Toggle Active/Disabled"
                >
                  {mat.is_active ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Rate Matrix */}
              <div className="mt-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Current Selling Rate:</span>
                  <div className="text-right">
                    <span className="font-mono text-base font-black text-slate-900 tabular-nums">
                      ₹{mat.selling_rate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans ml-1">/ {mat.unit}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-500 font-mono text-[11px] pt-2 border-t border-slate-200">
                  <span className="font-sans">Cost Estimate:</span>
                  <span>₹{mat.cost_estimate.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500 font-mono text-[11px]">
                  <span className="font-sans">Driver Default Rate:</span>
                  <span>₹{mat.driver_default_rate.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {canModifyRates() && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(mat)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Rates & Units
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD / EDIT MATERIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4 my-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingMatId ? 'Edit Material Rates & Parameters' : 'Add New Material / Service'}
              </h3>
              <p className="text-xs text-slate-500">
                Update selling rates and driver defaults for fast POS billing
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item / Service Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. M-Sand / River Sand / Land Filling"
                  className="w-full border border-slate-300 rounded p-2 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="material">Construction Material</option>
                    <option value="service">Transport & Earthwork Service</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2"
                  >
                    <option value="Unit">Unit (Standard Chennai measure)</option>
                    <option value="Load">Load</option>
                    <option value="Ton">Ton</option>
                    <option value="Cubic Feet">Cubic Feet (CFT)</option>
                    <option value="Cubic Meter">Cubic Meter (CBM)</option>
                    <option value="Trip">Trip</option>
                    <option value="Job">Job / Lump sum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={sellingRate}
                    onChange={e => setSellingRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={costEstimate}
                    onChange={e => setCostEstimate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Rate (₹)</label>
                  <input
                    type="number"
                    value={driverDefaultRate}
                    onChange={e => setDriverDefaultRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Grading, application, quality grade details..."
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
