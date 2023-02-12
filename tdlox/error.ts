function report(line: number, where: string, message: string) {
  const m = `[line ${line}] Error${where}: ${message}`;
  console.log(m);
  return m;
}

export function error(line: number, message: string) {
  return report(line, "", message);
}
