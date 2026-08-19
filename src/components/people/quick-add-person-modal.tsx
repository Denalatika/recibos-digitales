'use client';

import React, { useState } from 'react';
import { UserPlus, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Person, PersonType } from '@/types/database';
import { maskBankAccount } from '@/lib/utils';

interface QuickAddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPerson: Person) => void;
}

export const QuickAddPersonModal: React.FC<QuickAddPersonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeCompany, addPerson, people } = useApp();

  const [fullName, setFullName] = useState('');
  const [personType, setPersonType] = useState<PersonType>('worker');
  const [internalId, setInternalId] = useState(`EMP-${String(people.length + 1).padStart(4, '0')}`);
  const [department, setDepartment] = useState('Operaciones');
  const [position, setPosition] = useState('Trabajador');
  const [rfc, setRfc] = useState('');
  const [contractType, setContractType] = useState('Sueldos y Salarios e Ingresos Asimilados a Salarios');
  const [bankName, setBankName] = useState('Santander');
  const [bankAccountMasked, setBankAccountMasked] = useState('•••• 1234');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Por favor ingresa el nombre completo.');
      return;
    }

    const created = addPerson({
      company_id: activeCompany?.id,
      full_name: fullName.trim(),
      person_type: personType,
      internal_id: internalId.trim(),
      department: department.trim(),
      position: position.trim(),
      rfc: rfc.trim().toUpperCase(),
      contract_type: contractType,
      bank_name: bankName.trim(),
      bank_account_masked: maskBankAccount(bankAccountMasked),
    });

    if (onSuccess) {
      onSuccess(created);
    }

    // Reset form
    setFullName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Registrar Nuevo Trabajador / Colaborador</h3>
              <p className="text-[11px] text-slate-500">Se agregará al directorio de {activeCompany?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej. Juan Carlos Pérez Morales"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clasificación / Rol</label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value as PersonType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
              <label className="block font-bold text-slate-700 mb-1">Número / ID de Empleado</label>
              <input
                type="text"
                placeholder="ej. EMP-001"
                value={internalId}
                onChange={(e) => setInternalId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Puesto o Cargo</label>
              <input
                type="text"
                placeholder="ej. Técnico de Instalaciones"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Departamento</label>
              <input
                type="text"
                placeholder="ej. Mantenimiento"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">R.F.C.</label>
              <input
                type="text"
                placeholder="ej. PEMJ900101XXX"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium font-mono uppercase focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Régimen / Contrato</label>
              <input
                type="text"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Banco de Depósito</label>
              <input
                type="text"
                placeholder="ej. BBVA / Santander"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cuenta / Últimos 4 dígitos</label>
              <input
                type="text"
                placeholder="ej. 8832"
                value={bankAccountMasked}
                onChange={(e) => setBankAccountMasked(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar y Seleccionar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
