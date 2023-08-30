/* eslint-disable */
export default (isCount, limit, offset, where) => {
    let select = 'select * from (';
    let delimitador = `limit ${limit} offset ${offset}`;

    if (isCount) {
        select = 'select count(1) as count from (';
        delimitador = '';
    }

    return `${select}
        select f.nome as familia, g.nome as genero, e.nome as especie, v.nome as variedade, null as sub_especie, null as sub_familia from variedades as v
        inner join especies as e on v.especie_id = e.id
        inner join generos as g on v.genero_id = g.id
        inner join familias as f on v.familia_id = f.id
        union
        select f.nome as familia, g.nome as genero, e.nome as especie, null as variedade, sb.nome as sub_especie, null as sub_familia from sub_especies as sb
        inner join especies as e on sb.especie_id = e.id
        inner join generos as g on sb.genero_id = g.id
        inner join familias as f on sb.familia_id = f.id
        union
        select f.nome as familia, g.nome as genero, e.nome as especie, null as variedade, null as sub_especie, null as sub_familia from especies as e
        inner join generos as g on e.genero_id = g.id
        inner join familias as f on e.familia_id = f.id
        where  e.id not in (select especie_id from variedades)
        union
        select f.nome as familia, g.nome as genero, null as especie, null as variedade, null as sub_especie, null as sub_familia from generos as g
        inner join familias as f on g.familia_id = f.id
        where  g.id not in (select genero_id from especies)
        union
        select f.nome as familia, null as genero, null as especie, null as variedade, null as sub_especie, sf.nome as sub_familia from sub_familias as sf
        inner join familias as f on sf.familia_id = f.id
        union
        select f.nome as familia, null as genero, null as especie, null as variedade, null as sub_especie, null as sub_familia from familias as f
        where  f.id not in (select familia_id from generos)
    ) as t
    ${delimitador}`
};

/* eslint-enable */
