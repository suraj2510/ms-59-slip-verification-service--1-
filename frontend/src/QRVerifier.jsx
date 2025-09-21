import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QRVerifier({ apiBase = 'http://localhost:4000', token, scannerId = 'counter-1' }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [message, setMessage] = useState('Point the camera to the QR');

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    let active = true;

    codeReaderRef.current.listVideoInputDevices().then((devices) => {
      if (!active) return;
      const deviceId = devices[0]?.deviceId;
      if (!deviceId) {
        setMessage('No camera found');
        return;
      }

      codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          codeReaderRef.current.reset();
          handleScanned(result.getText());
        }
      });
    }).catch(err => setMessage('Camera error: ' + err.message));

    return () => {
      active = false;
      codeReaderRef.current?.reset();
    };
  }, []);

  async function handleScanned(slipId) {
    setMessage(`Verifying ${slipId}...`);
    try {
      const res = await fetch(`${apiBase}/queue/verify/${encodeURIComponent(slipId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scannerId })
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(`${body.code}: ${body.message}`);
      } else {
        setMessage(`Verified: ${body.slip.code} at ${body.slip.usedAt}`);
      }
    } catch (e) {
      setMessage('Network error: ' + e.message);
    } finally {
      setTimeout(() => {
        try { codeReaderRef.current?.listVideoInputDevices().then(devices => {
          const deviceId = devices[0]?.deviceId;
          if (deviceId) codeReaderRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
            if (result) { codeReaderRef.current.reset(); handleScanned(result.getText()); }
          });
        });
        } catch (e) { console.error(e); }
      }, 2000);
    }
  }

  return (
    <div>
      <h3>Counter Scanner</h3>
      <video ref={videoRef} style={{ width: '100%', maxWidth: 480 }} />
      <p>{message}</p>
      <button onClick={() => { codeReaderRef.current?.reset(); setMessage('Scanner reset'); }}>Reset</button>
    </div>
  );
}
