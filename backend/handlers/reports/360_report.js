Request.RespContentType = 'application/json';
// =============================   LOGS   =====================================
var _log_tag = "assessment_report";
EnableLog(_log_tag);

function Log(message) {
    LogEvent(_log_tag, message);
}
// ============================================================================



// ============================   STRINGS   ===================================
var STRINGS = {
    NO_RESULT: "Оценка отсутствует",
    NO_RESULT_SHORT: "-",
    RESULT_COMPETENCE: "Итоговая оценка",
    TABLE: {
        PERSON_FULLNAME: "Оцениваемый",
        MANAGER_FULLNAME: "Руководитель",
        PERSON_POSITION: "Должность",
        PERSON_SUB: "Подразделение",
        PERSON_ORG: "Организация",
        PERSON_STAGE: "Текущий этап (Оцениваемый)",
        MANAGER_STAGE: "Текущий этап (Руководитель)",
        PERSON_SCORE: "Оценка (Оцениваемый)",
        MANAGER_SCORE: "Оценка (Руководитель)",
        COMPETENCE_NAME: "Название компетенции",
        INDICATOR_NAME: "Название индикатора"
    }
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
    if (DataType(xmlElem) != "object") return xmlElem;
    if (!ArrayCount(xmlElem)) return RValue(xmlElem);

    var elem;
    var is_multiple = true;
    var previous_name = null;

    for (elem in xmlElem)
    {
        if (previous_name != null && previous_name != String(elem.Name))
        {
            is_multiple = false;
        }
        if (String(elem.Name)+"s" != String(xmlElem.Name))
        {
            is_multiple = false;
        }
        previous_name = String(elem.Name);
    }

    if (is_multiple)
    {
        var _arr = []
        for (elem in xmlElem)
        {
            _arr.push(ToJsObject(elem));
        }
        return _arr;
    }
    else
    {
        var _robj = {};
        for (elem in xmlElem)
        {
            _robj.SetProperty(elem.Name, ToJsObject(elem));
        }
        return _robj;
    }
}

// Функция заполнения шапки (колонок) таблицы
function SetColumns(columns, colls_count, staff_count)
{
    AddColumn(columns, STRINGS.TABLE.PERSON_FULLNAME, "person_fullname");
    AddColumn(columns, STRINGS.TABLE.MANAGER_FULLNAME, "manager_fullname");
    AddColumn(columns, STRINGS.TABLE.PERSON_POSITION, "person_position");
    AddColumn(columns, STRINGS.TABLE.PERSON_SUB, "person_sub");
    AddColumn(columns, STRINGS.TABLE.PERSON_ORG, "person_org");
    AddColumn(columns, STRINGS.TABLE.PERSON_STAGE, "person_stage");
    AddColumn(columns, STRINGS.TABLE.MANAGER_STAGE, "manager_stage");
    AddColumn(columns, STRINGS.TABLE.COMPETENCE_NAME, "competence_name");
    AddColumn(columns, STRINGS.TABLE.INDICATOR_NAME, "indicator_name");
    AddColumn(columns, STRINGS.TABLE.PERSON_SCORE, "person_score");
    AddColumn(columns, STRINGS.TABLE.MANAGER_SCORE, "manager_score");

    for (i = 0; i < colls_count; i++)
    {
        AddColumn(columns, "Оценка (Коллега " + (i+1) + ")", "coll_" + i);
    }

    for (i = 0; i < staff_count; i++)
    {
        AddColumn(columns, "Оценка (Подчинённый " + (i+1) + ")", "staff_" + i);
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

function GetCompetenceName(competence_id)
{
    try
    {
        return OpenDoc(UrlFromDocID(Int(competence_id))).TopElem.name.Value;
    }
    catch (e)
    {
        Log("Не найдена competence (ID: " + competence_id + ")");
        return "";
    }
}

function SetCompetenceRow(rows, person_info, personal_pas, idx)
{   
    var _self_pa = personal_pas.self;
    var _manager_pa = personal_pas.manager;
    var _coll_pas = personal_pas.coll;
    var _staff_pas = personal_pas.staff;

    var _manager_name = STRINGS.NO_RESULT;
    var _manager_stage = STRINGS.NO_RESULT;

    if (_manager_pa != null)
    {
        _manager_name = _manager_pa.expert_person_id.sd.fullname;
        _manager_stage = _manager_pa.workflow_state_name;
    }

    var _manager_score, _self_score;

    try
    {
        _manager_score = _manager_pa.competences[idx].mark_value;
    }
    catch(e)
    {
        _manager_score = null;
    }
    if (_manager_score == null)
    {
        _manager_score = STRINGS.NO_RESULT_SHORT;
    }


    _self_score = _self_pa.competences[idx].mark_value;
    if (_self_score == null)
    {
        _self_score = STRINGS.NO_RESULT_SHORT;
    }



    _competence_te = OpenDoc(UrlFromDocID(Int(_self_pa.competences[idx].competence_id))).TopElem;

    var _row =
        {
            person_fullname: person_info.name,
            manager_fullname:  _manager_name,
            person_position: person_info.position_name,
            person_sub: person_info.position_parent_name,
            person_org: person_info.org_name,
            person_stage: _self_pa.workflow_state_name,
            manager_stage: _manager_stage,
            competence_name: _competence_te.name.Value,
            indicator_name: "",
            person_score: _self_score,
            manager_score: _manager_score
        }

    var i, _coll_pa, _coll_name, _coll_mark;
    for (i = 0; i < ArrayCount(_coll_pas); i++)
    {
        _coll_pa = _coll_pas[i];
        _coll_name = _coll_pa.expert_person_id.sd.fullname;
        
        try
        {
            _coll_mark = _coll_pa.competences[idx].mark_value == null ? STRINGS.NO_RESULT_SHORT : _coll_pa.competences[idx].mark_value;
        }
        catch (e)
        {
            _coll_mark = STRINGS.NO_RESULT_SHORT;

        }
        _row.SetProperty("coll_" + i, _coll_name + ": " + _coll_mark);
    }

    for (i = 0; i < ArrayCount(_staff_pas); i++)
    {
        _coll_pa = _staff_pas[i];
        _coll_name = _coll_pa.expert_person_id.sd.fullname;
        
        try
        {
            _coll_mark = _coll_pa.competences[idx].mark_value == null ? STRINGS.NO_RESULT_SHORT : _coll_pa.competences[idx].mark_value;
        }
        catch (e)
        {
            _coll_mark = STRINGS.NO_RESULT_SHORT;

        }
        _row.SetProperty("staff_" + i, _coll_name + ": " + _coll_mark);
    }

    rows.push(_row);
}

function SetIndicatorRow(rows, person_info, personal_pas, comp_idx, ind_idx)
{
    var _self_pa = personal_pas.self;
    var _manager_pa = personal_pas.manager;
    var _coll_pas = personal_pas.coll;
    var _staff_pas = personal_pas.staff;

    var _manager_name = STRINGS.NO_RESULT;
    var _manager_stage = STRINGS.NO_RESULT;

    if (_manager_pa != null)
    {
        _manager_name = _manager_pa.expert_person_id.sd.fullname;
        _manager_stage = _manager_pa.workflow_state_name;
    }

    var _manager_score, _self_score;

    try
    {
        _manager_score = _manager_pa.competences[comp_idx].indicators[ind_idx].mark_value;
    }
    catch(e)
    {
        _manager_score = null;
    }
    if (_manager_score == null)
    {
        _manager_score = STRINGS.NO_RESULT_SHORT;
    }


    _self_score = _self_pa.competences[comp_idx].indicators[ind_idx].mark_value;
    if (_self_score == null)
    {
        _self_score = STRINGS.NO_RESULT_SHORT;
    }



    var _competence_te = OpenDoc(UrlFromDocID(Int(_self_pa.competences[comp_idx].competence_id))).TopElem;
    var _indicator_te = OpenDoc(UrlFromDocID(Int(_self_pa.competences[comp_idx].indicators[ind_idx].indicator_id))).TopElem;

    var _row =
        {
            person_fullname: person_info.name,
            manager_fullname:  _manager_name,
            person_position: person_info.position_name,
            person_sub: person_info.position_parent_name,
            person_org: person_info.org_name,
            person_stage: _self_pa.workflow_state_name,
            manager_stage: _manager_stage,
            competence_name: _competence_te.name.Value,
            indicator_name: _indicator_te.name.Value,
            person_score: _self_score,
            manager_score: _manager_score
        }

    var i, _coll_pa, _coll_name, _coll_mark;
    for (i = 0; i < ArrayCount(_coll_pas); i++)
    {
        _coll_pa = _coll_pas[i];
        _coll_name = _coll_pa.expert_person_id.sd.fullname;
        
        try
        {
            _coll_mark = _coll_pa.competences[comp_idx].indicators[ind_idx].mark_value == null ? STRINGS.NO_RESULT_SHORT : _coll_pa.competences[comp_idx].indicators[ind_idx].mark_value;
        }
        catch (e)
        {
            _coll_mark = STRINGS.NO_RESULT_SHORT;

        }
        _row.SetProperty("coll_" + i, _coll_name + ": " + _coll_mark);
    }

    for (i = 0; i < ArrayCount(_staff_pas); i++)
    {
        _coll_pa = _staff_pas[i];
        _coll_name = _coll_pa.expert_person_id.sd.fullname;
        
        try
        {
            _coll_mark = _coll_pa.competences[comp_idx].indicators[ind_idx].mark_value == null ? STRINGS.NO_RESULT_SHORT : _coll_pa.competences[comp_idx].indicators[ind_idx].mark_value;
        }
        catch (e)
        {
            _coll_mark = STRINGS.NO_RESULT_SHORT;

        }
        _row.SetProperty("staff_" + i, _coll_name + ": " + _coll_mark);
    }

    rows.push(_row);
}

function SetOverallRow(rows, person_info, personal_pas)
{
    var _self_pa = personal_pas.self;
    var _manager_pa = personal_pas.manager;
    var _coll_pas = personal_pas.coll;
    var _staff_pas = personal_pas.staff;

    var _manager_name = STRINGS.NO_RESULT;
    var _manager_stage = STRINGS.NO_RESULT;

    if (_manager_pa != null)
    {
        _manager_name = _manager_pa.expert_person_id.sd.fullname;
        _manager_stage = _manager_pa.workflow_state_name;
    }

    var _manager_score, _self_score;
    
    try
    {
        _manager_score = _manager_pa.overall;
    }
    catch(e)
    {
        _manager_score = null;
    }
    if (_manager_score == null)
    {
        _manager_score = STRINGS.NO_RESULT_SHORT;
    }


    _self_score = _self_pa.overall;
    if (_self_score == null)
    {
        _self_score = STRINGS.NO_RESULT_SHORT;
    }

    var _row =
        {
            person_fullname: person_info.name,
            manager_fullname:  _manager_name,
            person_position: person_info.position_name,
            person_sub: person_info.position_parent_name,
            person_org: person_info.org_name,
            person_stage: _self_pa.workflow_state_name,
            manager_stage: _manager_stage,
            competence_name: STRINGS.RESULT_COMPETENCE,
            indicator_name: "",
            person_score: _self_score,
            manager_score: _manager_score
        }

    var i, _coll_pa, _coll_name, _coll_mark;
    for (i = 0; i < ArrayCount(_coll_pas); i++)
    {
        _coll_pa = _coll_pas[i];
        _coll_name = _coll_pa.expert_person_id.sd.fullname;
        _coll_mark = _coll_pa.overall != null ? _coll_pa.overall : STRINGS.NO_RESULT_SHORT;

        _row.SetProperty("coll_" + i, _coll_name + ": " + _coll_mark);
    }

    for (i = 0; i < ArrayCount(_staff_pas); i++)
    {
        _coll_pa = _staff_pas[i];
        _coll_name = _coll_pa.expert_person_id.sd.fullname;
        _coll_mark = _coll_pa.overall != null ? _coll_pa.overall : STRINGS.NO_RESULT_SHORT;
        
        _row.SetProperty("staff_" + i, _coll_name + ": " + _coll_mark);
    }

    rows.push(_row);
}

function SetPersonRows(rows, _person_id, personal_pas)
{
    // Log(tools.object_to_text(personal_pas, "json"));
    if (personal_pas.self == null) return;

    var _person_info = GetCollaboratorShortInfo(Int(_person_id));

    for (i = 0; i < ArrayCount(personal_pas.self.competences); i++)
    {
        SetCompetenceRow(rows, _person_info, personal_pas, i);

        for (j = 0; j < ArrayCount(personal_pas.self.competences[i].indicators); j++)
        {
            SetIndicatorRow(rows, _person_info, personal_pas, i, j);
        }
    }

    SetOverallRow(rows, _person_info, personal_pas);

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

// Функция группировки анкет по пользователем.
// Возвращает максимальные количества анкет, заполняемых коллегами и подчинёнными
function GroupPasByPerson(pas, person_ids)
{
    var _resObj =
        {
            pas: {},
            max_coll_count: 0,
            max_staff_count: 0
        };
    
    for (_person_id in person_ids)
    {
        _personal_pas = GetPersonalPas(pas, _person_id);

        _resObj.max_coll_count = Max(_resObj.max_coll_count, ArrayCount(_personal_pas.coll));
        _resObj.max_staff_count = Max(_resObj.max_staff_count, ArrayCount(_personal_pas.staff));

        _resObj.pas.SetProperty(_person_id, _personal_pas);
    }
    
    return _resObj;
}

// Функция получения кратких сведений о сотруднике
function GetCollaboratorShortInfo(coll_id)
{
    var _form_xml = '\
        <?xml version="1.0" encoding="utf-8"?>\
        <SPXML-FORM>\
            <USE FORM="//wtv/ms_general.xmd"/>\
            <person_form>\
                <id TYPE="integer"/>\
                <INHERIT TYPE="person_name_base"/>\
                <name TYPE="string" EXPR="fullname"/>\
                <position_name TYPE="string"/>\
                <position_parent_name TYPE="string"/>\
                <org_name TYPE="string"/>\
            </person_form>\
        </SPXML-FORM>\
    ';

    var _form_name = "x-local://wtv/coll_info_for_assessment_report.xmd";

    // DropFormsCache("*" + _form_name + "*"); // TODO: Remove
    if (GetOptCachedForm(_form_name) == undefined) {
        RegisterFormFromStr(_form_name, _form_xml);
    }

    return ToJsObject(OpenDoc(UrlFromDocID(Int(coll_id)), "ignore-top-elem-name=1;form="+_form_name).TopElem);
}

// Функция получения кратких сведений об анкете
function GetPaShortInfo(pa_id)
{
    var _form_xml = '\
        <?xml version="1.0" encoding="utf-8"?>\
        <SPXML-FORM>\
            <USE FORM="//wtv/ms_general.xmd"/>\
            <pa_form>\
                <id TYPE="integer"/>\
                <person_id TYPE="integer"/>\
                <expert_person_id TYPE="integer">\
                    <sd>\
                        <fullname TYPE="string"/>\
                    </sd>\
                </expert_person_id>\
                <status TYPE="string"/>\
                <workflow_state_name TYPE="string"/>\
                <overall TYPE="real"/>\
                <competences TITLE="const=ass_competences">\
                    <competence MULTIPLE="1" PRIMARY-KEY="competence_id">\
                        <competence_id TYPE="integer" FOREIGN-ARRAY="competences"/>\
                        <mark_value TYPE="real"/>\
                        <indicators>\
                            <indicator MULTIPLE="1" PRIMARY-KEY="indicator_id">\
                                <indicator_id TYPE="integer" FOREIGN-ARRAY="indicators"/>\
                                <mark_value TYPE="real"/>\
                            </indicator>\
                        </indicators>\
                    </competence>\
                </competences>\
            </pa_form>\
        </SPXML-FORM>\
    ';

    var _form_name = "x-local://wtv/pa_info_for_assessment_report.xmd"

    DropFormsCache("*" + _form_name + "*"); // TODO: Remove
    if (GetOptCachedForm(_form_name) == undefined) {
        RegisterFormFromStr(_form_name, _form_xml);
    }

    var _obj = OpenDoc(UrlFromDocID(Int(pa_id)), "ignore-top-elem-name=1;form="+_form_name).TopElem;

    return ToJsObject(_obj);
}
// ============================================================================


// ============================   SQL   =======================================
function SQL_GetPas(appr_id, coll_id)
{
    var _sql =
        "SELECT \
            id, \
            person_id, \
            expert_person_id, \
            expert_person_fullname, \
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



// ============================   DB   ========================================
function DB_GetPas(appr_id, coll_id)
{
    var _sql = SQL_GetPas(appr_id, coll_id);
    return ArrayExtract(XQuery("sql: " + _sql), "GetPaShortInfo(ToJsObject(This).id)");
}
// ============================================================================



// ===========================   REPORT   =====================================
// Функция построения отчета
function BuildReport(appr_id, coll_id)
{
    var _columns = [];
    var _rows = [];

    var _pas = DB_GetPas(appr_id, coll_id);

    if (!ArrayCount(_pas))
    {    
        throw "pas_not_found";
    }

    // Список сотрудников, для которых найдены анкеты
    var _person_ids = ArraySelectDistinctKeys(_pas, "This.person_id");

    // .pas - сгруппированные анкеты
    // .max_coll_count - макс. кол-во анкет, заполняемых коллегами
    // .max_staff_count - макс. кол-во анкет, заполняемых подчиненными
    var _grouped_pas = GroupPasByPerson(_pas, _person_ids); 
    
    SetColumns(_columns, _grouped_pas.max_coll_count, _grouped_pas.max_staff_count);

    for (_person_id in _grouped_pas.pas)
    {
        _personal_pas = _grouped_pas.pas[_person_id];

        SetPersonRows(_rows, _person_id, _personal_pas);
    }


    SendResponse(true, "success", {columns: _columns, rows: _rows});
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