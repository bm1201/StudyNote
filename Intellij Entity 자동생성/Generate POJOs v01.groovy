import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*

/*
* Available context bindings:
*   SELECTION   Iterable<DasObject>
*   PROJECT     project
*   FILES       files helper
*/

//컬럼 타입 매핑 설정
typeMapping = [
        (~/(?i)int/)                      : "long",
        (~/(?i)float|double|decimal|real/): "double",
        (~/(?i)datetime|timestamp/)       : "Timestamp",
        (~/(?i)date/)                     : "Date",
        (~/(?i)time/)                     : "Time",
        (~/(?i)/)                         : "String"
]

//Key설정
def input(InputText) {
    JFrame jframe = new JFrame()
    def answer = JOptionPane.showInputDialog(InputText)
    jframe.dispose()
    return answer
}

primaryKey = input("Key컬럼을 입력하세요. \n" +
        "데이터 작성법 : USER_ID -> userId \n" +
        "단일키의 경우 : userId \n" +
        "복합키의 경우 : userId, occurId")

if (primaryKey != null && primaryKey != "") {
    FILES.chooseDirectoryAndSave("Choose directory", "Choose where to store generated files") { dir ->
        SELECTION.filter { it instanceof DasTable }.each { generate(it, dir) }
    }
}


def generate(table, dir) {
    //테이블이름
    def tableName = table.getName()
    //java 클래스이름
    def className = javaName(tableName, true)

    //필드명
    def fields = calcFields(table)

    //Entity생성
    new File(dir, tableName + ".java").withPrintWriter { out -> generate(out, tableName, className, fields, dir) }

    //KeyEntity생성
    new File(dir, tableName + "_KEY.java").withPrintWriter { out -> generateKey(out, tableName, className, fields, dir) }
}

//Entity 생성 설정
def generate(out, tableName, className, fields, dir) {
    //패키지명
    def packageName = setPackageNm(dir, className)
    //key SearchField
    def SearchFieldKey = setSearchFieldKey(primaryKey)

    out.println "package $packageName;"
    out.println ""
    out.println "import lombok.*;"
    out.println "import java.io.Serializable;"
    out.println "import kr.co.neighbor21.gunsan_os_api.common.annotation.SearchField;"
    out.println ""
    out.println "import javax.persistence.*;"
    out.println "import java.util.*;"
    out.println ""
    out.println "/**"
    out.println " * @Description : "
    out.println " * @Modification Information"
    out.println " *                 수정일     수정자               수정내용"
    out.println " *               --------------------------------------------------"
    out.println " *"
    out.println " *"
    out.println " * @author"
    out.println " * @version 1.0.0"
    out.println " * @since"
    out.println " */"
    out.println "@Setter"
    out.println "@Getter"
    out.println "@Entity"
    out.println "@ToString //TODO : delete"
    out.println "@Table(name = \"$tableName\")"
    out.println "public class $tableName" + " {"
    out.println ""
    out.println "    @EmbeddedId"
    out.println "    @SearchField(columnName = {\"$SearchFieldKey\"})"
    out.println "    private ${tableName}_KEY key;"
    fields.each() {
        if (!primaryKey.contains(it.name)) {
            if (it.comment != "" && it.comment != null) {
                out.println "    /*${it.comment}*/"
            }
            out.println "    @Column(name = \"${it.oriName}\")"
            out.println "    @SearchField(columnName = \"${it.name}\")"
            if (it.type.equals("Date")) {
                out.println "    @Temporal(TemporalType.TIMESTAMP)"
            }
            out.println "    private ${it.type} ${it.name};"
            out.println ""
        }
    }
    out.println "}"
}

//KeyEntity 생성 설정
def generateKey(out, tableName, className, fields, dir) {
    def packageName = setPackageNm(dir, className)

    out.println "package $packageName;"
    out.println ""
    out.println "import java.io.Serializable;"
    out.println ""
    out.println "import javax.persistence.Column;"
    out.println "import javax.persistence.Embeddable;"
    out.println "import lombok.*;"
    out.println "import java.util.*;"
    out.println ""
    out.println "/**"
    out.println " * @Description : "
    out.println " * @Modification Information"
    out.println " *                  수정일     수정자               수정내용"
    out.println " *               --------------------------------------------------"
    out.println " *"
    out.println " *"
    out.println " * @author"
    out.println " * @version 1.0.0"
    out.println " * @since"
    out.println " */"
    out.println "@Setter"
    out.println "@Getter"
    out.println "@Embeddable"
    out.println "public class $tableName" + "_KEY implements Serializable {"
    out.println ""
    out.println "    private static final long serialVersionUID = 1L;"
    out.println ""
    fields.each() {
        if (primaryKey.contains(it.name)) {
            //notNull이 아닌경우만
            if (it.comment != "" && it.comment != null) {
                out.println "    /*${it.comment}*/"
            }
            out.println "    @Column(name = \"${it.oriName}\")"
            out.println "    private ${it.type} ${it.name};"
            out.println ""
        }
    }
    out.println "}"
}

//패키지 이름생성 생성함수
def setPackageNm(dir, className) {
    String s = dir

    String name = s.substring(s.indexOf("java\\") + 5)

    name = name.replaceAll("\\\\", ".")

    return name;
}

//클래스명 생성함수
def javaName(tableName, flag) {
    def s = tableName.tokenize("_")
    //클래스명 생성
    s.size() == 1 ? s[0].toLowerCase().capitalize() : s[s.size() - 1].toLowerCase().capitalize()
}

//컬럼명 생성함수
def setColumnNm(columnName) {
    def s = columnName.tokenize("_")
    def name = ''
    for (int i = 0; i < s.size(); i++) {
        if (i == 0) {
            name = name + s[i].toLowerCase()
        } else {
            name = name + s[i].toLowerCase().capitalize()
        }
    }
    return name;
}

//필드명 생성함수
def calcFields(table) {
    DasUtil.getColumns(table).reduce([]) { fields, col ->
        def spec = Case.LOWER.apply(col.getDataType().getSpecification())
        def typeStr = typeMapping.find { p, t -> p.matcher(spec).find() }.value
        fields += [[
                           name   : setColumnNm(col.getName()),
                           oriName: col.getName(),
                           type   : typeStr,
                           comment: col.getComment(),
                   ]]
    }
}

//key SearchField 명
def setSearchFieldKey(primaryKey) {
    def s = primaryKey.tokenize(",")
    def SearchFieldKey = ""

    for (int i = 0; i < s.size(); i++) {
        if (i == s.size() - 1) {
            SearchFieldKey = SearchFieldKey + "key." + s[i].trim()
        } else {
            SearchFieldKey = SearchFieldKey + "key." + s[i].trim() + ", "
        }
    }

    return SearchFieldKey
}