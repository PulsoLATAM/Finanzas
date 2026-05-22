import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  valor: string;
  subvalor?: string;
  cambio?: string;
  cambioPositivo?: boolean;
  icon?: ReactNode;
  acento?: 'emerald' | 'blue' | 'amber' | 'red' | 'violet';
  small?: boolean;
}

const acentoMap = {
  emerald: 'text-emerald-400 bg-emerald-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  red: 'text-red-400 bg-red-500/10',
  violet: 'text-violet-400 bg-violet-500/10',
};

export default function StatCard({
  titulo,
  valor,
  subvalor,
  cambio,
  cambioPositivo,
  icon,
  acento = 'emerald',
  small = false,
}: Props) {
  const colors = acentoMap[acento];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {titulo}
        </span>
        {icon && (
          <div className={`p-2 rounded-xl ${colors}`}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className={`font-bold text-white ${small ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
          {valor}
        </p>
        {subvalor && (
          <p className="text-xs text-gray-500 mt-0.5">{subvalor}</p>
        )}
      </div>

      {cambio !== undefined && (
        <div
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
            cambioPositivo
              ? 'bg-emerald-500/10 text-emerald-400'
              : cambioPositivo === false
              ? 'bg-red-500/10 text-red-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {cambioPositivo === true ? '▲' : cambioPositivo === false ? '▼' : '●'}{' '}
          {cambio}
        </div>
      )}
    </div>
  );
}
