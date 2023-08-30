export default function formataDataColeta(...args) {
    const partes = args.reduce((saida, arg) => {
        if (String(arg).length > 0) {
            saida.push(arg);
        }

        return saida;
    }, []);

    return partes.join('/');
}
