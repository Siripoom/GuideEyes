// src/services/BusRecognition.ts
import axios from 'axios';
import RNFS from 'react-native-fs';

interface Bus {
  id: string;
  lineNumber: string;
  colors: string[];
  description: string;
  route: {
    start: string;
    end: string;
    via: string[];
  };
  keywords: string[];
}

class BusRecognitionService {
  private busDatabase: Bus[] = [];
  private ollamaBaseUrl: string;
  private cache: Map<string, any> = new Map();

  constructor() {
    // ใช้ localhost เพราะเราตั้ง port forwarding แล้ว
    this.ollamaBaseUrl = 'http://172.21.128.39:11434';

    this.initializeDatabase();
  }

  // โหลดฐานข้อมูลรถโดยสาร
  private async initializeDatabase() {
    console.log('Initializing bus database...');
    this.busDatabase = this.getDefaultBusDatabase();
  }

  // ฐานข้อมูลเริ่มต้น
  private getDefaultBusDatabase(): Bus[] {
    return [
      {
        id: '8',
        lineNumber: '8',
        colors: ['แดง', 'ครีม'],
        description: 'รถเมล์สีแดงหมายเลข 8 วิ่งจากหัวลำโพงถึงสะพานใหม่',
        route: {
          start: 'หัวลำโพง',
          end: 'สะพานใหม่',
          via: ['สีลม', 'สยาม', 'ชิดลม', 'ประตูน้ำ', 'อนุสาวรีย์ชัยฯ'],
        },
        keywords: ['รถเมล์แดง', 'สาย 8', 'แปด', 'หัวลำโพง', 'สะพานใหม่'],
      },
      {
        id: '39',
        lineNumber: '39',
        colors: ['เหลือง'],
        description:
          'รถเมล์สีเหลืองหมายเลข 39 วิ่งจากพระราม 4 ถึงเซ็นทรัลปิ่นเกล้า',
        route: {
          start: 'พระราม 4',
          end: 'เซ็นทรัลปิ่นเกล้า',
          via: ['สุรวงศ์', 'สาทร', 'สะพานพุทธ', 'ธนบุรี', 'ปิ่นเกล้า'],
        },
        keywords: ['รถเมล์เหลือง', 'สาย 39', 'สามสิบเก้า', 'ปิ่นเกล้า'],
      },
      {
        id: '97',
        lineNumber: '97',
        colors: ['น้ำเงิน', 'ขาว'],
        description:
          'รถเมล์สีน้ำเงินหมายเลข 97 วิ่งจากอนุสาวรีย์ชัยสมรภูมิถึงกระทรวงสาธารณสุข',
        route: {
          start: 'อนุสาวรีย์ชัยสมรภูมิ',
          end: 'กระทรวงสาธารณสุข',
          via: ['สนามเป้า', 'อารีย์', 'สะพานใหม่', 'บางซ่อน', 'ตลาดนนทบุรี'],
        },
        keywords: [
          'รถเมล์น้ำเงิน',
          'สาย 97',
          'เก้าสิบเจ็ด',
          'อนุสาวรีย์',
          'ติวานนท์',
        ],
      },
      {
        id: '510',
        lineNumber: '510',
        colors: ['ฟ้า', 'ขาว'],
        description:
          'รถเมล์ธรรมดาหมายเลข 510 วิ่งจากอนุสาวรีย์ชัยสมรภูมิถึงมหาวิทยาลัยธรรมศาสตร์ รังสิต',
        route: {
          start: 'อนุสาวรีย์ชัยสมรภูมิ',
          end: 'ธรรมศาสตร์ รังสิต',
          via: ['พหลโยธิน', 'สะพานควาย', 'ดอนเมือง', 'รังสิต'],
        },
        keywords: [
          'รถเมล์ฟ้า',
          'สาย 510',
          'ห้าหนึ่งศูนย์',
          'อนุสาวรีย์',
          'ธรรมศาสตร์',
        ],
      },
    ];
  }

  // ฟังก์ชันหลักสำหรับจดจำรถเมล์
  public async recognizeBus(
    imageBase64: string,
    userLocation?: {lat: number; lng: number},
  ): Promise<{
    recognized: boolean;
    busInfo?: Bus;
    confidence: number;
    message: string;
  }> {
    try {
      console.log('Starting bus recognition...');
      console.log('Image base64 length:', imageBase64.length);

      // เรียก Ollama Vision
      const visionResult = await this.callOllamaVision(imageBase64);

      // วิเคราะห์ผลลัพธ์
      const result = this.analyzeBusFromVision(visionResult);

      return result;
    } catch (error) {
      console.error('Bus recognition error:', error);
      console.error('Error details:', (error as any).response?.data);
      console.error('Error status:', (error as any).response?.status);
      return {
        recognized: false,
        confidence: 0,
        message: 'ไม่สามารถเชื่อมต่อกับ Ollama ได้: ' + (error as any).message,
      };
    }
  }

  // เรียก Ollama Vision API
  private async callOllamaVision(imageBase64: string) {
    try {
      console.log(`Calling Ollama at ${this.ollamaBaseUrl}`);

      const response = await axios.post(
        `${this.ollamaBaseUrl}/api/generate`,
        {
          model: 'llama3.2-vision',
          prompt: `Analyze this Thai bus image. Identify:
1. Bus number (ตัวเลขสายรถเมล์)
2. Bus colors (สีของรถ)
3. Any visible Thai or English text

Respond in JSON format:
{
  "busNumber": "number",
  "colors": ["color1", "color2"],
  "text": ["text"],
  "confidence": 0-100
}`,
          images: [imageBase64],
          stream: false,
          format: 'json',
        },
        {
          timeout: 30000,
        },
      );

      console.log('Ollama response:', response.data);

      try {
        return JSON.parse(response.data.response);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        return {
          busNumber: null,
          colors: [],
          text: [],
          confidence: 0,
        };
      }
    } catch (error) {
      console.error('Ollama Vision error:', error);
      throw error;
    }
  }

  // วิเคราะห์ผลลัพธ์
  private analyzeBusFromVision(visionResult: any): {
    recognized: boolean;
    busInfo?: Bus;
    confidence: number;
    message: string;
  } {
    console.log('Analyzing vision result:', visionResult);

    if (!visionResult.busNumber) {
      return {
        recognized: false,
        confidence: 0,
        message: 'ไม่พบหมายเลขรถเมล์ในภาพ',
      };
    }

    // ค้นหาจากฐานข้อมูล
    const busNumber = visionResult.busNumber.toString();
    const matchedBus = this.busDatabase.find(
      bus => bus.lineNumber === busNumber,
    );

    if (matchedBus) {
      return {
        recognized: true,
        busInfo: matchedBus,
        confidence: (visionResult.confidence || 80) / 100,
        message: `พบรถเมล์สาย ${
          matchedBus.lineNumber
        } สี${matchedBus.colors.join('/')} ${matchedBus.description}`,
      };
    }

    return {
      recognized: false,
      confidence: visionResult.confidence / 100 || 0,
      message: `พบรถเมล์สาย ${busNumber} แต่ไม่มีข้อมูลในระบบ`,
    };
  }

  // ทดสอบการเชื่อมต่อ
  public async testOllamaConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/version`);
      console.log('Ollama version:', response.data);
      return true;
    } catch (error) {
      console.error('Failed to connect to Ollama:', error);
      return false;
    }
  }
}

export default new BusRecognitionService();