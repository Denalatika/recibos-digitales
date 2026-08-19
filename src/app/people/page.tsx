'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  PlusCircle, 
  Search, 
  Building2, 
  CreditCard, 
  Archive, 
  Edit3, 
  CheckCircle2, 
  Mail, 
  Phone, 
  FileText,
  X
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useApp } from '@/context/app-context';
import { Person, PersonType } from '@/types/database';
import { maskBankAccount } from '@/lib/utils';

export default function PeopleDirectoryPage() {
  const { 
    activeCompany, 
    activeCompanyPeople, 
    people, 
    addPerson, 
    updatePerson, 
    archivePerson,
    activeCompanyReceipts
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [personType, setPersonType] = useState<PersonType>('worker');
  const [internalId, setInternalId] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [rfc, setRfc] = useState('');
  const [curp, setCurp] = useState('');
  const [nss, setNss] = useState('');
  const [contractType, setContractType] = useState('Sueldos y Salarios e Ingresos Asimilados a Salarios');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('Santander');
  const [bankAccountMasked, setBankAccountMasked] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const filteredPeople = activeCompanyPeople.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      p.full_name.toLowerCase().includes(search) || 
      (p.internal_id && p.internal_id.toLowerCase().includes(search)) ||
      (p.rfc && p.rfc.toLowerCase().includes(search)) ||
      (p.position && p.position.toLowerCase().includes(search));

    const matchesType = typeFilter === 'all' || p.person_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openAddModal = () => {
    setEditingPerson(null);
    setFullName('');
    setPersonType('worker');
    setInternalId(`COL-${String(people.length + 1).padStart(4, '0')}`);
    setDepartment('Operaciones');
    setPosition('Especialista');
    setRfc('');
    setCurp('');
    setNss('');
    setContractType('Sueldos y Salarios e Ingresos Asimilados a Salarios');
    setPhone('');
    setEmail('');
    setAddress('');
    setBankName('Santander');
    setBankAccountMasked('•••• 1234');
    setInternalNotes('');
    setModalOpen(true);
  };

  const openEditModal = (p: Person) => {
    setEditingPerson(p);
    setFullName(p.full_name);
    setPersonType(p.person_type);
    setInternalId(p.internal_id || '');
    setDepartment(p.department || '');
    setPosition(p.position || '');
    setRfc(p.rfc || '');
    setCurp(p.curp || '');
    setNss(p.nss || '');
    setContractType(p.contract_type || '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setAddress(p.address || '');
    setBankName(p.bank_name || 'Santander');
    setBankAccountMasked(p.bank_account_masked || '');
    setInternalNotes(p.internal_notes || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('El nombre completo es obligatorio');
      return;
    }

    const payload: Partial<Person> = {
      company_id: activeCompany?.id,
      full_name: fullName,
      person_type: personType,
      internal_id: internalId,
      department: department,
      position: position,
      rfc: rfc.toUpperCase(),
      curp: curp.toUpperCase(),
      nss: nss,
      contract_type: contractType,
      phone: phone,
      email: email,
      address: address,
      bank_name: bankName,
      bank_account_masked: maskBankAccount(bankAccountMasked),
      internal_notes: internalNotes,
    };

    if (editingPerson) {
      updatePerson(editingPerson.id, payload);
    } else {
      addPerson(payload);
    }

    setModalOpen(false);
  };

  const typeLabels: Record<PersonType, { label: string; color: string }> = {
    worker: { label: 'Trabajador', color: 'bg-blue-100 text-blue-800' },
    collaborator: { label: 'Colaborador', color: 'bg-cyan-100 text-cyan-800' },
    user: { label: 'Usuario', color: 'bg-purple-100 text-purple-800' },
    client: { label: 'Cliente', color: 'bg-emerald-100 text-emerald-800' },
    supplier: { label: 'Proveedor', color: 'bg-amber-100 text-amber-800' },
    other: { label: 'Otro', color: 'bg-slate-100 text-slate-800' },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Directorio de Personal y Trabajadores
            </h1>
            <p className="text-xs text-slate-500">
              Administra tus trabajadores, colaboradores y proveedores de {activeCompany?.name} para emitirles recibos con un clic.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>+ Registrar Trabajador / Colaborador</span>
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, RFC o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full md:w-auto"
            >
              <option value="all">Todos los Roles</option>
              <option value="worker">Trabajador</option>
              <option value="collaborator">Colaborador</option>
              <option value="supplier">Proveedor</option>
              <option value="client">Cliente</option>
              <option value="user">Usuario</option>
            </select>
          </div>
        </div>

        {/* Tarjetas de Personas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((p) => {
            const receiptsCount = activeCompanyReceipts.filter(r => r.person_id === p.id).length;
            const badge = typeLabels[p.person_type] || typeLabels.worker;

            return (
              <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.color}`}>
                        {badge.label}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1.5">{p.full_name}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{p.position || 'Puesto no especificado'}</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {p.internal_id || 'SIN ID'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400 text-[11px]">DEPARTAMENTO:</span>
                      <span className="font-semibold text-slate-700">{p.department || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400 text-[11px]">RFC:</span>
                      <span className="font-mono font-bold text-slate-700">{p.rfc || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400 text-[11px]">BANCO & CUENTA:</span>
                      <span className="font-semibold text-slate-700">{p.bank_name || 'Banco'} ({p.bank_account_masked || '•••• 0000'})</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/receipts/new?personId=${p.id}`}
                    className="flex items-center space-x-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-bold py-1.5 px-3 rounded-lg border border-cyan-200 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Crear Recibo</span>
                  </Link>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar datos del trabajador"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Archivar a ${p.full_name}? No se borrarán sus recibos históricos.`)) {
                          archivePerson(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Archivar persona"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPeople.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No se encontraron personas registradas en esta empresa.
            </div>
          )}
        </div>

        {/* Modal de Registro / Edición */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {editingPerson ? 'Editar Información' : 'Registrar Nueva Persona'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. María Fernanda Ríos Martínez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clasificación</label>
                    <select
                      value={personType}
                      onChange={(e) => setPersonType(e.target.value as PersonType)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option value="worker">Trabajador</option>
                      <option value="collaborator">Colaborador</option>
                      <option value="supplier">Proveedor</option>
                      <option value="client">Cliente</option>
                      <option value="user">Usuario</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número / ID Interno</label>
                    <input
                      type="text"
                      placeholder="ej. COL-0184"
                      value={internalId}
                      onChange={(e) => setInternalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Puesto</label>
                    <input
                      type="text"
                      placeholder="ej. Coordinador de Proyectos"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      placeholder="ej. Ingeniería"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">R.F.C.</label>
                    <input
                      type="text"
                      placeholder="ej. RIMM920715MDFRNR06"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CURP</label>
                    <input
                      type="text"
                      placeholder="ej. RIMM920715..."
                      value={curp}
                      onChange={(e) => setCurp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Régimen / Contrato</label>
                  <input
                    type="text"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Banco</label>
                    <input
                      type="text"
                      placeholder="ej. Santander"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cuenta / Últimos 4 Dígitos</label>
                    <input
                      type="text"
                      placeholder="ej. 6712"
                      value={bankAccountMasked}
                      onChange={(e) => setBankAccountMasked(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm"
                  >
                    {editingPerson ? 'Guardar Cambios' : 'Registrar Persona'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
