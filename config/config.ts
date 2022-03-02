require('dotenv').config()

export default function config(key: string): string {
  return process.env[key] as string
}
