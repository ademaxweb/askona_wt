const VTable = {
    props: {
        table: {
            type: Object,
            required: true
        },
        tableId: {
            type: [String, null],
            required: false,
            default: null
        },
        baseFileName: {
            type: [String, null],
            required: false,
            default: "table"
        }
    },

    setup(props) {
        const rowsRef = Vue.toRef(props.table, "rows");
        const { set_key, sorted: sorted_rows } = useSorter(rowsRef);

        const exportToExcel = () => {
            console.log("test")

            if (!props.tableId) return;

            var wb = XLSX.utils.table_to_book(document.getElementById(props.tableId));
            const date = new Date();

            const formattedDate = date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(/[.,\s\/]/g, '_').replace(/_+/g, '_');

            XLSX.writeFile(wb, `${props.baseFileName}_${formattedDate}.xlsx`, { raw: true });
        };

        return {
            set_key,
            sorted_rows,
            exportToExcel
        };
    },

    template: `
        <div class="table_wrapper">
            <table class="table" :id="tableId">
                <thead>
                    <tr>
                        <th v-for="column in table.columns" @click="set_key(column.key)">
                            {{ column.value }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in sorted_rows">
                        <td v-for="column in table.columns">{{ row[column.key] }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};