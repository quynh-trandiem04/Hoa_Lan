import React from 'react';
import { FileText, Download, Eye, Calendar, User, Database, Table, HelpCircle } from 'lucide-react';
import { OrchidDocument } from '../types';

interface DocCardProps {
  doc: OrchidDocument;
  onPreview: (doc: OrchidDocument) => void;
  onDownload: (doc: OrchidDocument) => void;
  key?: string;
}

export default function DocCard({ doc, onPreview, onDownload }: DocCardProps) {
  // Determine icon based on format
  const getFormatIcon = () => {
    switch (doc.format) {
      case 'PDF':
        return (
          <div className="flex flex-col items-center">
            <FileText className="w-8 h-8 text-red-600 opacity-80 stroke-[1.5]" />
            <span className="text-[10px] font-bold text-outline mt-1 uppercase tracking-wider">PDF</span>
          </div>
        );
      case 'DOCX':
        return (
          <div className="flex flex-col items-center">
            <FileText className="w-8 h-8 text-blue-600 opacity-80 stroke-[1.5]" />
            <span className="text-[10px] font-bold text-outline mt-1 uppercase tracking-wider">DOCX</span>
          </div>
        );
      case 'XLSX':
        return (
          <div className="flex flex-col items-center">
            <Table className="w-8 h-8 text-botanical-green opacity-80 stroke-[1.5]" />
            <span className="text-[10px] font-bold text-outline mt-1 uppercase tracking-wider">XLSX</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center">
            <HelpCircle className="w-8 h-8 text-outline opacity-80 stroke-[1.5]" />
            <span className="text-[10px] font-bold text-outline mt-1 uppercase tracking-wider">DOC</span>
          </div>
        );
    }
  };

  // Determine category badge background color
  const getCategoryBadgeClass = () => {
    switch (doc.categoryLabel) {
      case 'Nghiên cứu':
        return 'bg-secondary-container text-on-secondary-container';
      case 'Hướng dẫn':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'Kỹ thuật':
        return 'bg-surface-variant text-on-surface-variant';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  return (
    <article className="bg-surface-container-lowest p-6 flex flex-col md:flex-row gap-6 luxury-shadow border border-outline-variant/20 hover:border-antique-gold/40 hover:-translate-y-1 transition-all duration-300 group">
      {/* File format icon container */}
      <div className="flex-shrink-0 flex items-center justify-center w-16 h-20 bg-surface-container-low rounded-sm border border-outline-variant/30 select-none">
        {getFormatIcon()}
      </div>

      {/* Main card body */}
      <div className="flex-grow flex flex-col">
        {/* Title and Category Tag */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
          <h3 
            onClick={() => onPreview(doc)}
            className="font-serif text-lg md:text-xl font-bold text-charcoal-text group-hover:text-botanical-green transition-colors cursor-pointer leading-snug"
          >
            {doc.title}
          </h3>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 whitespace-nowrap ${getCategoryBadgeClass()}`}>
            {doc.categoryLabel}
          </span>
        </div>

        {/* Metadata section */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-outline mb-3.5 font-sans font-medium">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 stroke-[1.5]" /> Tác giả: {doc.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 stroke-[1.5]" /> Năm: {doc.year}
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 stroke-[1.5]" /> Dung lượng: {doc.size}
          </span>
        </div>

        {/* Description preview */}
        <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-4 font-sans line-clamp-2 max-w-3xl">
          {doc.description}
        </p>

        {/* Custom luxury actions */}
        <div className="flex items-center gap-6 mt-auto">
          <button 
            onClick={() => onDownload(doc)}
            className="border-2 border-antique-gold text-antique-gold font-sans text-xs uppercase tracking-wider font-bold px-5 py-2 hover:bg-antique-gold hover:text-white transition-all duration-300 flex items-center gap-2 select-none"
          >
            <Download className="w-4 h-4 stroke-[2]" /> Tải xuống
          </button>
          
          <button 
            onClick={() => onPreview(doc)}
            className="text-outline hover:text-botanical-green font-sans text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 select-none"
          >
            <Eye className="w-4 h-4 stroke-[1.5]" /> Xem trước
          </button>
        </div>
      </div>
    </article>
  );
}
