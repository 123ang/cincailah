'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

interface InviteShareProps {
  makanCode: string;
  groupName: string;
}

export default function InviteShare({ makanCode, groupName }: InviteShareProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [canShare, setCanShare] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setInviteUrl(`${window.location.origin}/join/${makanCode}`);
    setCanShare(
      typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
    );
  }, [makanCode]);

  const copy = (text: string, which: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'code') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `Join ${groupName} on Cincailah`,
      text: `🍛 Join my makan group "${groupName}" on Cincailah! Makan Code: ${makanCode}`,
      url: inviteUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copy(inviteUrl, 'link');
      }
    } catch {
      // user cancelled share sheet; no-op
    }
  };

  const downloadQr = () => {
    const svg = qrWrapRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cincailah-${makanCode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-sambal to-red-500 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80">Your Makan Code</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-3xl font-black tracking-widest">{makanCode}</p>
            <button
              onClick={() => copy(makanCode, 'code')}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
              aria-label="Copy Makan Code"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowQr((v) => !v)}
          className="bg-white/20 hover:bg-white/30 text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zm0 10h6v6h-6v-6zM4 14h6v6H4v-6z" />
          </svg>
          {showQr ? 'Hide QR' : 'QR'}
        </button>
      </div>

      {showQr && inviteUrl && (
        <div
          ref={qrWrapRef}
          className="mt-4 bg-white rounded-2xl p-4 flex flex-col items-center"
        >
          <QRCodeSVG
            value={inviteUrl}
            size={180}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#0F172A"
          />
          <p className="text-[11px] text-gray-500 mt-2 text-center">
            Scan to join <span className="font-semibold">{groupName}</span>
          </p>
          <button
            onClick={downloadQr}
            className="mt-2 text-xs text-slate font-semibold hover:underline"
          >
            Download QR
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleShare}
          className="flex-1 bg-white text-sambal font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-white/90 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {canShare ? 'Share invite' : 'Copy link'}
        </button>
        <button
          onClick={() => copy(inviteUrl, 'link')}
          className="sm:w-auto bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition"
        >
          {linkCopied ? 'Link copied ✓' : 'Copy link'}
        </button>
      </div>

      <p className="text-xs opacity-70 mt-3 break-all">{inviteUrl || '...'}</p>
    </div>
  );
}
