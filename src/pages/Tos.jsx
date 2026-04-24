import { ScrollText } from 'lucide-react';

const TOS_SECTIONS = [
  {
    title: '1. Penerimaan Ketentuan',
    content: 'Dengan menggunakan layanan ZelpStore, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, harap jangan gunakan layanan kami.',
  },
  {
    title: '2. Penggunaan Layanan',
    content: 'Layanan kami dirancang untuk hosting server game. Anda setuju untuk tidak menggunakan layanan kami untuk aktivitas ilegal, spam, DDoS pada pihak ketiga, atau pelanggaran hak cipta.',
  },
  {
    title: '3. Pembayaran & Refund',
    content: 'Semua pembayaran bersifat final. Saldo yang sudah di-deposit tidak dapat di-refund. Perpanjangan server harus dilakukan sebelum masa aktif berakhir.',
  },
  {
    title: '4. Suspend & Penghentian',
    content: 'Kami berhak untuk menangguhkan atau menghentikan layanan Anda tanpa pemberitahuan jika melanggar ketentuan penggunaan, termasuk penyalahgunaan sumber daya.',
  },
  {
    title: '5. Privasi Data',
    content: 'Kami mengumpulkan data minimal yang diperlukan untuk operasi layanan. Data Anda tidak akan dijual kepada pihak ketiga. Detail lengkap di Privacy Policy kami.',
  },
  {
    title: '6. Perubahan Ketentuan',
    content: 'Kami berhak mengubah ketentuan ini sewaktu-waktu. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru.',
  },
];

export default function Tos() {
  return (
    <div className="p-6 lg:p-8 animate-in max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
          <ScrollText size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Terms of Service</h1>
          <p className="text-text-muted text-sm">Ketentuan penggunaan layanan ZelpStore</p>
        </div>
      </div>

      <div className="card p-8 space-y-6">
        <p className="text-text-secondary text-sm">Terakhir diperbarui: April 2026</p>
        {TOS_SECTIONS.map((sec) => (
          <div key={sec.title} className="border-t border-white/5 pt-5">
            <h3 className="text-base font-black text-text-primary mb-2">{sec.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{sec.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
