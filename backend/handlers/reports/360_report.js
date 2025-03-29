Request.RespContentType = 'application/json';
// =============================   LOGS   =====================================
var _log_tag = "assessment_report";
EnableLog(_log_tag);

function Log(message) {
    LogEvent(_log_tag, message);
}
// ============================================================================



// ===========================   FUNCTIONS   ==================================
// Функция отправки ответа на запрос
function SendResponse(success, message, data)
{
    Response.Write(tools.object_to_text({
        success: success,
        message: message,
        data: data
    }, "json"))
}

// Функция парса параметров запроса
function ParseQueryParams()
{
    return {
        coll_id: Request.Query.GetOptProperty("coll_id", null),
        appr_id: Request.Query.GetOptProperty("appr_id", null)
    }
}

// Функция приведения XML элемента к JS объекту
function ToJsObject(xmlElem) {
    var elem;
    var robj = {};
    for (elem in xmlElem)
    {
        robj.SetProperty(elem.Name, RValue(elem));
    }
    return robj;
}

// Функция заполнения шапки (колонок) таблицы
function SetColumns(columns, colls_count, staff_count)
{
    AddColumn(columns, "Оцениваемый", "person_fullname");
    AddColumn(columns, "Руководитель", "manager_fullname");
    AddColumn(columns, "Должность", "person_position");
    AddColumn(columns, "Подразделение", "person_sub");
    AddColumn(columns, "Организация", "person_org");
    AddColumn(columns, "Текущий этап (Оцениваемый)", "person_stage");
    AddColumn(columns, "Текущий этап (Руководитель)", "manager_stage");

    for (i = 0; i < colls_count; i++)
    {
        AddColumn(columns, "Оценка (Коллега " + (i+1) + ")", "coll_" + (i+1));
    }

    for (i = 0; i < colls_count; i++)
    {
        AddColumn(columns, "Оценка (Коллега " + (i+1) + ")", "staff_" + (i+1));
    }
}

// Функция добавление колонки в таблицу 
function AddColumn(columns, value, key)
{
    columns.push(
        {
            value: value,
            key: key
        }
    )
}

// Функция выбора анкет по конкретному пользователю
function GetPersonalPas(pas, person_id)
{

    var _personal_pas = ArraySelectByKey(pas, person_id, "person_id");
    var _personal_staff_pas = ArraySelectByKey(_personal_pas, "staff", "status");
    var _personal_coll_pas = ArraySelectByKey(_personal_pas, "coll", "status");
    var _personal_manager_pas = ArraySelectByKey(_personal_pas, "manager", "status");
    var _personal_self_pas = ArraySelectByKey(_personal_pas, "self", "status")

    return {
        staff: _personal_staff_pas,
        coll: _personal_coll_pas,
        manager: ArrayOptFirstElem(_personal_manager_pas, null),
        self: ArrayOptFirstElem(_personal_self_pas, null)
    }
}

// Функция получения кратких сведений о сотруднике
function GetCollaboratorInfo(coll_id)
{
    var _form_xml = '\
        <?xml version="1.0" encoding="utf-8"?>\
        <SPXML-FORM>\
            <USE FORM="//wtv/ms_general.xmd"/>\
            <person_form>\
                <id TYPE="integer"/>\
                <position_name TYPE="string"/>\
                <position_parent_name TYPE="string"/>\
                <org_name TYPE="string"/>\
            </person_form>\
        </SPXML-FORM>\
    ';

    var _form_name = "x-local://wtv/coll_info_for_assessment_report.xmd";

    DropFormsCache("*" + _form_name + "*"); // TODO: Remove
    if (GetOptCachedForm(_form_name) == undefined) {
        RegisterFormFromStr(_form_name, _form_xml);
    }

    return OpenDoc(UrlFromDocID(Int(coll_id), "ignore-top-elem-name=1;form=" + _form_name));
}
// ============================================================================


// ============================   SQL   =======================================
function SQL_GetPAs(appr_id, coll_id)
{
    var _sql =
        "SELECT \
            id, \
            person_id, \
            expert_person_id, \
            status \
        FROM dbo.pas \
        WHERE \
            assessment_appraise_type = 'competence_appraisal' \
            AND assessment_appraise_id = " + appr_id + " \
            AND person_id ";

    if (coll_id == null || coll_id == "")
    {
        _sql += "IS NOT NULL";
    }
    else
    {
        _sql += ("= " + coll_id)
    }

    return _sql;
}
// ============================================================================


// ===========================   REPORT   =====================================
// Функция построения отчета
function BuildReport(appr_id, coll_id)
{
    var _columns = [];
    var _rows = [];

    var _sql = SQL_GetPAs(appr_id, coll_id);
    var _pas = ArrayExtract(XQuery("sql: " + _sql), "ToJsObject(This)");

    if (!ArrayCount(_pas))
    {
        Log("Не найдены анкеты для следующих параметров: appr_id="+appr_id+" coll_id="+coll_id);    
        throw "pas_not_found";
    }

    // Список сотрудников, для которых найдены анкеты
    var _person_ids = ArraySelectDistinctKeys(_pas, "This.person_id");

    var _persons_pas = {}; // Список анкет по каждому сотруднику
    var _coll_pas_max_count = 0; // Максимальное кол-во анкет, заполненняемых коллегами
    var _staff_pas_max_count = 0;  // Максимальное кол-во анкет, заполняемых подчинёнными

    for (_person_id in _person_ids)
    {
        _personal_pas = GetPersonalPas(_pas, _person_id);

        _coll_pas_max_count = ArrayCount(_personal_pas.coll) > _coll_pas_max_count ? ArrayCount(_personal_pas.coll) : _coll_pas_max_count;
        _staff_pas_max_count = ArrayCount(_personal_pas.staff) > _staff_pas_max_count ? ArrayCount(_personal_pas.staff) : _staff_pas_max_count;

        _persons_pas.SetProperty(_person_id, _personal_pas);
    }

    SetColumns(_columns, _coll_pas_max_count, _staff_pas_max_count);

    SendResponse(true, "success", {columns: _columns, rows: _rows, data: _persons_pas});
}
// ============================================================================



// ============================   MAIN   ======================================
try
{
    var _params = ParseQueryParams();

    Log("Новый запрос с параметрами: " + tools.object_to_text(_params, "json"));

    try
    {
        OpenDoc(UrlFromDocID(Int(_params.appr_id))).TopElem;
    }
    catch(e)
    {
        Log(String(e));
        throw "wrong_appr_id"
    }

    BuildReport(_params.appr_id, _params.coll_id)
}
// ============================================================================



// ===========================   ERRORS   =====================================
catch (err)
{
    Log(String(err));
    SendResponse(false, err.message, {})
}
// ============================================================================