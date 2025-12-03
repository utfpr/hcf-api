export default function limparEspacos(str) {
    if (!str) return str;
    return str.trim().replace(/\s+/g, ' ');
}
