_log_tag = "pd_find_colleagues"
EnableLog(_log_tag);


function Log(message)
{
    alert(message);
    LogEvent(_log_tag, message);
}

function GetAppraiseColls()
{
    var _group_id = 7144039978436115334; // Группа участников оценки
    var _sql =
        "select \
            collaborator_id \
        from dbo.group_collaborators \
        where group_id = " + _group_id;

    return ArrayExtract(ArraySelectAll(XQuery("sql: " + _sql)), "Int(This.collaborator_id)");
}

function GetBossSubs1(boss_id)
{
    var _sql =
        "select \
            object_id \
        from dbo.func_managers \
        where person_id = " + boss_id;

    return ArrayExtract(ArraySelectAll(XQuery("sql: " + _sql)), "Int(This.object_id)");
}

function GetBossSubs2(boss_id)
{
    return ArrayExtract(tools.get_direct_sub_person_ids(Int(boss_id)), "Int(This)");
}

try
{
    var _person_id = Int(personID); // ID сотрудника, для которого ищем коллег
    // var _person_id = Int(Param.person); // ID сотрудника, для которого ищем коллег

    var _appraise_colls = GetAppraiseColls(); // Сотрудники в оценке

    _person_boss = tools.get_uni_user_boss(_person_id); // Руководитель сотрудника

    _subs =  GetBossSubs2(_person_boss.id) // Подчиненные руководителя;

    _colleagues = ArraySelect(_subs, "Int(_person_id) != This") // Подчиненные руководителя, участвующие в оценке;

    MASTERS_PACK = ArrayIntersect(_colleagues, _appraise_colls);

    // for (_m in MASTERS_PACK)
    // {
    //     Log(String(OpenDoc(UrlFromDocID(_m)).TopElem.fullname));
    // }

}
catch (e)
{
    Log(String(e));
    MASTERS_PACK = [];
}