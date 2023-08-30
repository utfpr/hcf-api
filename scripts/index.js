import axios from 'axios';

// eslint-disable-next-line
const getURL = (page, limit) => `https://www.gbif.org/api/taxonomy/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c/6/children?limit=${limit}&occ=false&offset=${(page * limit - limit)}`;

const request = (page, limit) => {
    const url = getURL(page, limit);
    // console.log(url); // eslint-disable-line
    return axios.get(url);
};

const get = (page = 1, limit = 100) => {
    request(page, limit)
        .then(response => {
            const { status, data } = response;
            if (status === 200 && !!data.endOfRecords) {
                console.log('Finished'); // eslint-disable-line
                return;
            }

            console.log(`Found ${data.results.length} records`); // eslint-disable-line
            console.log(`Requesting next ${limit} records...`); // eslint-disable-line

            get(page + 1, limit);
        });
};


get(1, 1000);
