// src/services/BusRecognition.ts
import axios from 'axios';
import Config from 'react-native-config';

// Google Vision API Key - ใส่ค่าจริงที่นี่หรือใน .env
const GOOGLE_VISION_API_KEY =
  Config.GOOGLE_VISION_API_KEY || 'AIzaSyDL24tbIFnNVaRsSZM9bpoN54NtyTKIj74';

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
  // private cache: Map<string, any> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  // โหลดฐานข้อมูลรถโดยสาร
  private initializeDatabase() {
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
        id: '47',
        lineNumber: '47',
        colors: ['แดง', 'ครีม'],
        description:
          'รถเมล์สีแดงหมายเลข 47 วิ่งจากคลองเตยถึงเดอะมอลล์งามวงศ์วาน',
        route: {
          start: 'คลองเตย',
          end: 'เดอะมอลล์งามวงศ์วาน',
          via: ['พระราม 4', 'หัวลำโพง', 'สนามหลวง', 'แยกผ่านฟ้า', 'งามวงศ์วาน'],
        },
        keywords: [
          'รถเมล์แดง',
          'สาย 47',
          'สี่สิบเจ็ด',
          'คลองเตย',
          'งามวงศ์วาน',
        ],
      },
      {
        id: '77',
        lineNumber: '77',
        colors: ['เขียว', 'เหลือง'],
        description: 'รถเมล์สีเขียวหมายเลข 77 วิ่งจากปากเกร็ดถึงสะพานพุทธ',
        route: {
          start: 'ปากเกร็ด',
          end: 'สะพานพุทธ',
          via: ['งามวงศ์วาน', 'วงศ์สว่าง', 'บางพลัด', 'สะพานพุทธ'],
        },
        keywords: [
          'รถเมล์เขียว',
          'สาย 77',
          'เจ็ดสิบเจ็ด',
          'ปากเกร็ด',
          'สะพานพุทธ',
        ],
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
      console.log('Starting bus recognition with Google Vision API...');
      console.log('Image size:', imageBase64.length);

      // ลบการตรวจสอบ cache นี้ออก
      // const cacheKey = this.generateCacheKey(imageBase64);
      // const cachedResult = this.cache.get(cacheKey);
      // if (cachedResult) {
      //   return cachedResult;
      // }

      // เรียก Google Vision API
      const visionResult = await this.callGoogleVision(imageBase64);

      // วิเคราะห์ผลลัพธ์
      const result = this.analyzeBusFromVision(visionResult);

      // ลบการเก็บผลลัพธ์ใน cache
      // this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Bus recognition error:', error);
      return {
        recognized: false,
        confidence: 0,
        message: 'ไม่สามารถจดจำรถเมล์ได้',
      };
    }
  }
  // เรียก Google Vision API
  private async callGoogleVision(imageBase64: string) {
    try {
      console.log('Calling Google Vision API...');

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          requests: [
            {
              image: {content: imageBase64},
              features: [
                {type: 'TEXT_DETECTION', maxResults: 10},
                {type: 'OBJECT_LOCALIZATION', maxResults: 10},
                {type: 'LABEL_DETECTION', maxResults: 10},
                {type: 'IMAGE_PROPERTIES', maxResults: 10},
              ],
            },
          ],
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Google Vision API response received');

      const result = response.data.responses[0];
      return {
        text: this.extractTextFromGoogleVision(result),
        objects: result.localizedObjectAnnotations || [],
        labels: result.labelAnnotations || [],
        colors: this.extractColorsFromGoogleVision(result),
        fullTextAnnotation: result.fullTextAnnotation,
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw error;
    }
  }

  // ดึงข้อความจาก Google Vision response
  private extractTextFromGoogleVision(data: any): string[] {
    const texts: string[] = [];

    // จาก textAnnotations
    if (data.textAnnotations && data.textAnnotations.length > 0) {
      texts.push(data.textAnnotations[0].description);
    }

    // จาก fullTextAnnotation
    if (data.fullTextAnnotation && data.fullTextAnnotation.text) {
      texts.push(data.fullTextAnnotation.text);
    }

    return texts;
  }

  // ดึงสีจาก Google Vision response
  private extractColorsFromGoogleVision(data: any): string[] {
    const colors: string[] = [];

    if (
      data.imagePropertiesAnnotation &&
      data.imagePropertiesAnnotation.dominantColors
    ) {
      const dominantColors =
        data.imagePropertiesAnnotation.dominantColors.colors;

      dominantColors.forEach((color: any) => {
        if (color.score > 0.1) {
          // เฉพาะสีที่มีคะแนนสูง
          const colorName = this.rgbToColorName(
            color.color.red,
            color.color.green,
            color.color.blue,
          );
          colors.push(colorName);
        }
      });
    }

    return [...new Set(colors)];
  }

  // วิเคราะห์ผลลัพธ์จาก Vision API
  private analyzeBusFromVision(visionResult: any): {
    recognized: boolean;
    busInfo?: Bus;
    confidence: number;
    message: string;
  } {
    console.log('Analyzing vision result...');

    // ค้นหาเลขรถเมล์จาก text
    const detectedNumbers = this.extractBusNumbers(visionResult.text);
    console.log('Detected numbers:', detectedNumbers);

    // ค้นหาสี
    const detectedColors = visionResult.colors;
    console.log('Detected colors:', detectedColors);

    // ค้นหาว่าเป็นรถเมล์หรือไม่
    const isBus = this.checkIfBus(visionResult.labels, visionResult.objects);
    console.log('Is bus:', isBus);

    if (!isBus || detectedNumbers.length === 0) {
      return {
        recognized: false,
        confidence: 0,
        message: 'ไม่พบรถเมล์ในภาพ',
      };
    }

    // จับคู่กับฐานข้อมูล
    let bestMatch: {bus: Bus | null; confidence: number} = {
      bus: null,
      confidence: 0,
    };

    for (const number of detectedNumbers) {
      const matchedBus = this.busDatabase.find(
        bus => bus.lineNumber === number,
      );

      if (matchedBus) {
        let confidence = 0.5; // Base confidence for number match

        // เพิ่มคะแนนถ้าสีตรงกัน
        const colorMatch = this.calculateColorMatch(
          detectedColors,
          matchedBus.colors,
        );
        confidence += colorMatch * 0.3;

        // เพิ่มคะแนนถ้าพบ keywords
        const keywordMatch = this.calculateKeywordMatch(
          visionResult.text,
          matchedBus.keywords,
        );
        confidence += keywordMatch * 0.2;

        if (confidence > bestMatch.confidence) {
          bestMatch = {bus: matchedBus, confidence};
        }
      }
    }

    if (bestMatch.bus) {
      return {
        recognized: true,
        busInfo: bestMatch.bus,
        confidence: bestMatch.confidence,
        message: `พบรถเมล์สาย ${
          bestMatch.bus.lineNumber
        } สี${bestMatch.bus.colors.join('/')} ${bestMatch.bus.description}`,
      };
    }

    // ถ้าไม่พบในฐานข้อมูล แต่เจอเลข
    return {
      recognized: false,
      confidence: 0.3,
      message: `พบรถเมล์สาย ${detectedNumbers[0]} แต่ไม่มีข้อมูลในระบบ`,
    };
  }

  // ตรวจสอบว่าเป็นรถเมล์หรือไม่
  private checkIfBus(labels: any[], objects: any[]): boolean {
    const busKeywords = [
      'bus',
      'vehicle',
      'transportation',
      'รถ',
      'รถเมล์',
      'รถโดยสาร',
    ];

    // ตรวจสอบจาก labels
    for (const label of labels) {
      if (
        busKeywords.some(keyword =>
          label.description.toLowerCase().includes(keyword),
        )
      ) {
        return true;
      }
    }

    // ตรวจสอบจาก objects
    for (const obj of objects) {
      if (
        obj.name.toLowerCase().includes('bus') ||
        obj.name.toLowerCase().includes('vehicle')
      ) {
        return true;
      }
    }

    return false;
  }

  // ดึงหมายเลขรถเมล์จาก text
  private extractBusNumbers(texts: string[]): string[] {
    const numbers: Set<string> = new Set();

    for (const text of texts) {
      // ค้นหาตัวเลข 1-3 หลัก
      const matches = text.match(/\b\d{1,3}\b/g);
      if (matches) {
        matches.forEach(match => {
          // กรองเฉพาะเลขที่น่าจะเป็นสายรถเมล์ (1-999)
          const num = parseInt(match);
          if (num >= 1 && num <= 999) {
            numbers.add(match);
          }
        });
      }

      // ค้นหาคำว่า "สาย" ตามด้วยตัวเลข
      const lineMatches = text.match(/สาย\s*(\d+)/g);
      if (lineMatches) {
        lineMatches.forEach(match => {
          const num = match.replace(/สาย\s*/, '');
          numbers.add(num);
        });
      }
    }

    return Array.from(numbers);
  }

  // คำนวณความตรงกันของสี
  private calculateColorMatch(
    detectedColors: string[],
    busColors: string[],
  ): number {
    if (!detectedColors || detectedColors.length === 0) return 0;

    let matchCount = 0;

    for (const busColor of busColors) {
      for (const detectedColor of detectedColors) {
        if (this.isColorMatch(busColor, detectedColor)) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount / busColors.length;
  }

  // คำนวณความตรงกันของ keywords
  private calculateKeywordMatch(texts: string[], keywords: string[]): number {
    const fullText = texts.join(' ').toLowerCase();
    let matchCount = 0;

    for (const keyword of keywords) {
      if (fullText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return matchCount / keywords.length;
  }

  // เปรียบเทียบสี
  private isColorMatch(color1: string, color2: string): boolean {
    const colorMap: {[key: string]: string[]} = {
      แดง: ['red', 'แดง', 'สีแดง'],
      เหลือง: ['yellow', 'เหลือง', 'สีเหลือง'],
      เขียว: ['green', 'เขียว', 'สีเขียว'],
      น้ำเงิน: ['blue', 'น้ำเงิน', 'สีน้ำเงิน', 'ฟ้า'],
      ขาว: ['white', 'ขาว', 'สีขาว', 'cream', 'ครีม'],
      ส้ม: ['orange', 'ส้ม', 'สีส้ม'],
      ม่วง: ['purple', 'ม่วง', 'สีม่วง'],
      ฟ้า: ['light blue', 'sky blue', 'ฟ้า', 'สีฟ้า', 'น้ำเงินอ่อน'],
      เทา: ['gray', 'grey', 'เทา', 'สีเทา'],
      ดำ: ['black', 'ดำ', 'สีดำ'],
    };

    const c1 = color1.toLowerCase();
    const c2 = color2.toLowerCase();

    // ตรวจสอบว่าสีตรงกันโดยตรงหรือไม่
    if (c1 === c2) return true;

    // ตรวจสอบจาก colorMap
    for (const [key, values] of Object.entries(colorMap)) {
      if (values.includes(c1) && values.includes(c2)) {
        return true;
      }
    }

    return false;
  }

  // แปลง RGB เป็นชื่อสี
  private rgbToColorName(r: number, g: number, b: number): string {
    // แปลง RGB เป็นชื่อสีไทย
    if (r > 180 && g < 100 && b < 100) return 'แดง';
    if (r > 200 && g > 180 && b < 100) return 'เหลือง';
    if (r < 100 && g > 150 && b < 100) return 'เขียว';
    if (r < 100 && g < 150 && b > 150) return 'น้ำเงิน';
    if (r > 200 && g > 200 && b > 200) return 'ขาว';
    if (r > 200 && g > 100 && b < 100) return 'ส้ม';
    if (r > 100 && g < 100 && b > 100) return 'ม่วง';
    if (r < 150 && g < 150 && b < 150) return 'เทา';
    if (r < 50 && g < 50 && b < 50) return 'ดำ';
    if (r > 150 && g > 200 && b > 255) return 'ฟ้า';

    return 'ไม่ทราบสี';
  }

  // สร้าง cache key
  private generateCacheKey(imageBase64: string): string {
    return imageBase64.substring(0, 100);
  }

  // ฟังก์ชันทดสอบการเชื่อมต่อ (แก้ไขให้ทดสอบ Google Vision API)
  public async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Google Vision API connection...');

      // สร้างรูป 1x1 pixel สำหรับทดสอบ
      const testImage =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          requests: [
            {
              image: {content: testImage},
              features: [{type: 'LABEL_DETECTION', maxResults: 1}],
            },
          ],
        },
        {
          timeout: 5000,
        },
      );

      console.log('Google Vision API test successful');
      return true;
    } catch (error) {
      console.error('Google Vision API test failed:', error);
      return false;
    }
  }
}

export default new BusRecognitionService();
