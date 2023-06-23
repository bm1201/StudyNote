import com.intellij.database.model.DasTable
import com.intellij.database.util.Case
import com.intellij.database.util.DasUtil

import javax.swing.*

/**
 * @Description : DTO, Repository 전체 자동생성
 * @Modification Information
 *                  수정일     수정자               수정내용
 *               ----------  ---------  -------------------------------
 *               2023.06.23  ByungMin   postgres 데이터 타입도 처리할 수 있도록 typeMapping 수정
 *                                      @Size -> @ByteSize 어노테이션 추가
 *                                      lombok * 필요한 라이브러리만 가져오도록 수정
 * @author ByungMin
 * @version 1.0.0
 * @since 2023-06-23
 */

/**
 * Available Function:
 * 1. 테이블 CamelCase로 변경 후 depth만큼 디렉토리 생성
 * 2. 파일 Directory명으로 PackageName 생성 및 선언
 * 3. 파일명은 테이블 CamelCase로 변경 후 DTO 추가 (ex) ay_a1_node -> AyA1NodeDTO)
 * 4. DB테이블의 모든 컬럼 DTO 생성
 * 5. String의 경우 @Size 어노테이션 추가
 * 6. NotNull 체크 되어 있는경우 @NotNull 어노테이션추가
 * 7. Repository 자동생성
 */

FILES.chooseDirectoryAndSave("Choose directory", "Choose where to store generated files") { dir ->
    SELECTION.filter { it instanceof DasTable }.each { generate(it, dir) }
}

def generate(table, dir) {
    //테이블이름
    def tableName = table.getName()

    //필드명
    def fields = calcFields(table)

    //디렉토리 및 파일명 생성
    def tableNmToken = tableName.tokenize("_");
    def nowDir = dir.toString();
    def fileNm = "";
    def repositoryNm = "";

    for(int i=0; i<tableNmToken.size(); i++){
        //파일명
        if(i == tableNmToken.size()-1){
            fileNm = fileNm + tableNmToken[i] + "DTO";
            repositoryNm = repositoryNm + tableNmToken[i] + "Repository";
        }else{
            fileNm = fileNm + tableNmToken[i].toLowerCase().capitalize();
            repositoryNm = repositoryNm + tableNmToken[i].toLowerCase().capitalize();
        }

        //디렉토리
        nowDir = nowDir + "\\" + tableNmToken[i];

        File newFile = new File(nowDir);

        if(!newFile.exists()){
            newFile.mkdir();
        }
    }
    
    //DTO생성
    new File(nowDir, fileNm + ".java").withPrintWriter { out -> generateDTO(out, tableName, fields, nowDir, fileNm) }

    //Repository생성
    new File(nowDir, repositoryNm + ".java").withPrintWriter { out -> generateRepository(out, tableName, fields, nowDir, repositoryNm) }
}

//Repository 생성 설정
def generateDTO(out, tableName, fields, nowDir, fileNm) {
    //패키지명
    def packageName = setPackageNm(nowDir)

    out.println "package $packageName;"
    out.println ""
    out.println "import lombok.Getter;"
    out.println "import lombok.Setter;"
    out.println "import javax.validation.*;"
    out.println "import io.swagger.annotations.ApiModel;"
    out.println "import io.swagger.annotations.ApiModelProperty;"
    out.println ""
    out.println "/**"
    out.println " * @Description : "
    out.println " * @Modification Information"
    out.println " *                  수정일     수정자               수정내용"
    out.println " *               ---------- --------- -------------------------------"
    out.println " *"
    out.println " *"
    out.println " * @author"
    out.println " * @version 1.0.0"
    out.println " * @since"
    out.println " */"
    out.println "@Getter"
    out.println "@Setter"
    out.println "@ApiModel(value = \"${fileNm} - \")"
    out.println "public class ${fileNm}" + " {"
    out.println ""
    fields.each() {
        if (it.comment != "" && it.comment != null) {
            out.println "    @ApiModelProperty(value = \"${it.comment} / ${it.oriType}\", example = \"\")"
        }
        if (it.isNotNull){
            out.println "    @NotNull"
        }
        if (it.size != "" && it.size != null){
            out.println "    ${it.size}"
        }
        out.println "    private ${it.type} ${it.name};"
        out.println ""
    }
    out.println "}"
}

//DTO 생성 설정
def generateRepository(out, tableName, fields, nowDir, repositoryNm) {
    //패키지명
    def packageName = setPackageNm(nowDir)

    out.println "package $packageName;"
    out.println ""
    out.println "import org.springframework.data.jpa.repository.JpaRepository;"
    out.println "import org.springframework.data.jpa.repository.JpaSpecificationExecutor;"
    out.println "import org.springframework.stereotype.Repository;"

    out.println "import kr.co.neighbor21.anyang_ad_api.entity.$tableName;"
    out.println "import kr.co.neighbor21.anyang_ad_api.entity.${tableName}_key;"
    out.println ""
    out.println "/**"
    out.println " * @Description : "
    out.println " * @Modification Information"
    out.println " *                  수정일     수정자               수정내용"
    out.println " *               ---------- --------- -------------------------------"
    out.println " *"
    out.println " *"
    out.println " * @author"
    out.println " * @version 1.0.0"
    out.println " * @since"
    out.println " */"
    out.println "@Repository"
    out.println "public interface $repositoryNm extends JpaRepository<$tableName, ${tableName}_key>, JpaSpecificationExecutor<$tableName> {"
    out.println ""
    out.println "}"
}

//패키지 이름생성 생성함수
def setPackageNm(nowDir) {
    String s = nowDir

    String name = s.substring(s.indexOf("java\\") + 5)

    name = name.replaceAll("\\\\", ".")

    return name;
}

//컬럼명 생성함수
def setColumnNm(columnName) {
    def s = columnName.tokenize("_")
    def name = ''
    for(int i=0; i<s.size(); i++) {
        if(i == 0){
            name = name + s[i].toLowerCase()
        }else {
            name = name + s[i].toLowerCase().capitalize()
        }
    }
    return name;
}

//필드명 생성함수
def calcFields(table) {
    DasUtil.getColumns(table).reduce([]) { fields, col ->
        def oriType = col.getDataType().toString()
        def typeStr = setType(oriType)
        def size = setSize(oriType)
        fields += [[
                           name : setColumnNm(col.getName()),
                           oriName : col.getName(),
                           oriType : oriType,
                           type : typeStr,
                           size : size,
                           comment : col.getComment(),
                           isNotNull : col.isNotNull()
                   ]]
    }
}

//필드 Type 설정 함수
def setType(oriType) {
    int s = oriType.indexOf("(") == -1 ? oriType.length() : oriType.indexOf("(");
    def type = "CHAR, VARCHAR2, NCHAR, NVARCHAR, varchar, char, geometry"
    def type2 = "NUMBER, FLOAT, numeric, int, int2, int4, int8, float4, float8"
    def typeStr = ""

    if(s !== -1){
        def typeNm = oriType.substring(0, s-1)

        if(type.contains(typeNm)){
            //문자열
            typeStr = "String"
            return typeStr
        }else if(type2.contains(typeNm)){
            //숫자
            typeStr = "Double"
            return typeStr
        }else{
            typeStr = "String"
            return typeStr
        }
    }
}

//필드 MinMax 설정 함수
def setSize(oriType) {
    int s = oriType.indexOf("(")
    def type = "CHAR, VARCHAR2, NCHAR, NVARCHAR, varchar, char"
    def type2 = "NUMBER, FLOAT, numeric, int, int2, int4, int8, float4, float8"
    def size = ""

    if(s !== -1){
        def typeNm = oriType.substring(0, s-1)

        if(type.contains(typeNm)){
            //문자열
            def maxSize = oriType.substring(s+1, oriType.length()-1)

            size = "@ByteSize(max = ${maxSize})"

            return size
        }
    }
}