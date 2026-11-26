// Common thermal printer BLE Service & Characteristic UUIDs
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART (Goojprt, MPT)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Pos-58/80 vendor
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / generic BLE serial
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothPrinterStatus {
  supported: boolean;
  connected: boolean;
  deviceName: string | null;
  lastError: string | null;
}

class BluetoothPrinterService {
  private device: any = null;
  private server: any = null;
  private writeCharacteristic: any = null;
  private deviceName: string | null = null;
  private lastError: string | null = null;

  /**
   * Codifica texto plano en bytes ESC/POS binarios compatibles con impresoras térmicas de 58/80 mm
   */
  encodeEscPos(text: string, options?: { cut?: boolean; width?: 58 | 80 }): Uint8Array {
    const bytes: number[] = [];

    // 1. Inicializar impresora: ESC @ (0x1B, 0x40)
    bytes.push(0x1b, 0x40);

    // 2. Seleccionar tabla de caracteres Latin 1 (CP850 / ISO-8859-1): ESC t 2
    bytes.push(0x1b, 0x74, 0x02);

    // 3. Convertir caracteres respetando acentos en español
    const charMap: Record<string, number> = {
      'á': 0xa0, 'é': 0x82, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3,
      'Á': 0x41, 'É': 0x90, 'Í': 0x49, 'Ó': 0x4f, 'Ú': 0x55,
      'ñ': 0xa4, 'Ñ': 0xa5,
      '¿': 0xa8, '¡': 0xad,
      'ü': 0x81, 'Ü': 0x9a,
      '$': 0x24,
    };

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (charMap[char] !== undefined) {
        bytes.push(charMap[char]);
      } else {
        const code = char.charCodeAt(0);
        if (code <= 127) {
          bytes.push(code);
        } else {
          // Carácter genérico fuera de rango ASCII
          bytes.push(0x20);
        }
      }
    }

    // 4. Alimentar 3 líneas
    bytes.push(0x1b, 0x64, 0x03);

    // 5. Corte de papel (para impresoras de 80mm con autocutter)
    if (options?.cut || options?.width === 80) {
      // GS V 66 0 (Corte parcial con avance de papel)
      bytes.push(0x1d, 0x56, 0x42, 0x00);
    }

    return new Uint8Array(bytes);
  }

  isSupported(): boolean {
    if (typeof navigator !== 'undefined' && !!(navigator as any).bluetooth) {
      return true;
    }
    return false;
  }

  getStatus(): BluetoothPrinterStatus {
    return {
      supported: this.isSupported(),
      connected: !!(this.device && this.device.gatt?.connected && this.writeCharacteristic),
      deviceName: this.deviceName,
      lastError: this.lastError,
    };
  }

  async connect(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isSupported()) {
      const err = 'Web Bluetooth no está habilitado en este navegador. Utiliza Google Chrome o un navegador compatible con BLE.';
      this.lastError = err;
      return { success: false, error: err };
    }

    try {
      const navBluetooth = (navigator as any).bluetooth;
      const device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!device) {
        return { success: false, error: 'No se seleccionó ningún dispositivo Bluetooth.' };
      }

      this.device = device;
      this.deviceName = device.name || 'Impresora Bluetooth Térmica';

      device.addEventListener('gattserverdisconnected', () => {
        this.writeCharacteristic = null;
        this.server = null;
        this.lastError = 'Impresora desconectada.';
      });

      const server = await device.gatt.connect();
      this.server = server;

      // Buscar característica de escritura en los servicios disponibles
      let characteristic: any = null;

      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          if (service) {
            const characteristics = await service.getCharacteristics();
            for (const c of characteristics) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                characteristic = c;
                break;
              }
            }
          }
        } catch {
          // Continuar buscando en el siguiente servicio
        }
        if (characteristic) break;
      }

      // Si no se encontró en servicios conocidos, iterar todos los servicios del dispositivo
      if (!characteristic) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            const chars = await service.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                characteristic = c;
                break;
              }
            }
            if (characteristic) break;
          }
        } catch {}
      }

      if (!characteristic) {
        throw new Error('No se encontró canal de escritura ESC/POS en el dispositivo.');
      }

      this.writeCharacteristic = characteristic;
      this.lastError = null;

      return { success: true, deviceName: this.deviceName || undefined };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al conectar impresora Bluetooth.';
      this.lastError = errorMsg;
      return { success: false, error: errorMsg };
    }
  }

  disconnect(): void {
    try {
      if (this.device && this.device.gatt?.connected) {
        this.device.gatt.disconnect();
      }
    } catch {}
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
    this.deviceName = null;
    this.lastError = null;
  }

  /**
   * Envía texto a imprimir directamente vía Bluetooth ESC/POS en paquetes de 64 bytes
   */
  async print(text: string, options?: { cut?: boolean; width?: 58 | 80 }): Promise<{ success: boolean; message: string }> {
    if (!this.getStatus().connected) {
      const connectRes = await this.connect();
      if (!connectRes.success || !this.writeCharacteristic) {
        return {
          success: false,
          message: connectRes.error || 'Impresora Bluetooth no conectada.',
        };
      }
    }

    try {
      const payload = this.encodeEscPos(text, options);
      const CHUNK_SIZE = 64; // BLE MTU seguro

      for (let offset = 0; offset < payload.length; offset += CHUNK_SIZE) {
        const slice = payload.slice(offset, offset + CHUNK_SIZE);
        if (this.writeCharacteristic.writeValueWithoutResponse) {
          await this.writeCharacteristic.writeValueWithoutResponse(slice);
        } else {
          await this.writeCharacteristic.writeValue(slice);
        }
        // Pequeño retardo para no saturar el buffer de la impresora térmica
        await new Promise((r) => setTimeout(r, 25));
      }

      return {
        success: true,
        message: `Ticket impreso en ${this.deviceName || 'impresora Bluetooth'} sin abrir diálogo del sistema.`,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Fallo al transmitir bytes ESC/POS a la impresora.';
      this.lastError = errorMsg;
      return {
        success: false,
        message: errorMsg,
      };
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();