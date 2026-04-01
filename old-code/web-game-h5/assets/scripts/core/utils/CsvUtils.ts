type CsvOptions = {
  delimiter?: string;
  headers?: string[];
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
};

export class CsvUtils {
  private readonly defaultOptions: CsvOptions = {
    delimiter: ',',
    headers: undefined,
    skipEmptyLines: true,
    trimWhitespace: true
  };

  constructor(private options: CsvOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  public convert(csv: string): any[] {
    if (!csv || typeof csv !== 'string') {
      throw new Error('Invalid CSV input. Expected a non-empty string.');
    }

    const lines = csv.split(/\r\n|\n|\r/);
    const records: any[] = [];
    let headers: string[] = this.options.headers;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 处理空行
      if (this.isEmptyLine(line)) {
        if (this.options.skipEmptyLines) continue;
        records.push({});
        continue;
      }

      const values = this.parseLine(line);

      // 处理标题行
      if (i === 0 && !headers) {
        headers = values;
        continue;
      }

      // 处理数据行
      if (headers) {
        const record = this.mapValuesToObject(values, headers);
        records.push(record);
      } else {
        // 如果没有标题，则使用索引作为键
        records.push(values);
      }
    }

    return records;
  }

  private isEmptyLine(line: string): boolean {
    return line.trim().length === 0;
  }

  private parseLine(line: string): string[] {
    const values: string[] = [];
    const delimiter = this.options.delimiter || ',';
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // 处理引号
        if (inQuotes) {
          if (i + 1 < line.length && line[i + 1] === '"') {
            // 转义的双引号 "" -> "
            currentValue += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          inQuotes = true;
        }
      } else if (char === delimiter && !inQuotes) {
        // 处理分隔符
        values.push(this.normalizeValue(currentValue));
        currentValue = '';
      } else {
        // 处理普通字符
        currentValue += char;
      }
    }

    // 添加最后一个值
    values.push(this.normalizeValue(currentValue));
    return values;
  }

  private normalizeValue(value: string): string {
    let result = value;
    
    // 去除首尾引号
    if (result.startsWith('"') && result.endsWith('"')) {
      result = result.substring(1, result.length - 1);
    }
    
    // 去除首尾空格
    if (this.options.trimWhitespace) {
      result = result.trim();
    }
    
    return result;
  }

  private mapValuesToObject(values: string[], headers: string[]): any {
    const record: any = {};
    
    for (let i = 0; i < values.length; i++) {
      const header = headers[i] || `column${i}`;
      record[header] = values[i];
    }
    
    return record;
  }
}
