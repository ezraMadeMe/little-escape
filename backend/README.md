# Little Escape Backend

Spring Boot 3.x 기반 백엔드 애플리케이션입니다.

## 기술 스택

- Java 17
- Spring Boot 3.2.0
- Spring Web
- Spring Data JPA
- PostgreSQL
- Lombok
- Validation
- Gradle (Groovy)

## 사전 요구사항

### Java 17 설치

macOS에서 Java 17을 설치하는 방법:

#### 방법 1: Homebrew 사용 (권장)
```bash
brew install openjdk@17
```

설치 후 환경 변수 설정:
```bash
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc
source ~/.zshrc
```

#### 방법 2: Oracle JDK 또는 OpenJDK 직접 다운로드
- [Oracle JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- [Adoptium (Eclipse Temurin)](https://adoptium.net/temurin/releases/?version=17)

### PostgreSQL 설치 및 설정

```bash
# Homebrew로 설치
brew install postgresql@15

# PostgreSQL 시작
brew services start postgresql@15

# 데이터베이스 생성
createdb littleescape
```

## 실행 방법

### 의존성 빌드
```bash
./gradlew build
```

### 애플리케이션 실행
```bash
./gradlew clean bootRun
```

또는 빌드된 JAR 실행:
```bash
./gradlew build
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
```

## 데이터베이스 설정

`src/main/resources/application.properties` 파일에서 PostgreSQL 연결 정보를 수정하세요:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/littleescape
spring.datasource.username=postgres
spring.datasource.password=postgres
```

## API 엔드포인트

- 애플리케이션: http://localhost:8080
- Actuator Health: http://localhost:8080/actuator/health

## 프로젝트 구조

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/littleescape/api/
│   │   └── resources/
│   └── test/
├── build.gradle
├── settings.gradle
└── gradlew
```

## 문제 해결

### Java를 찾을 수 없는 경우

1. Java가 설치되어 있는지 확인:
```bash
java -version
```

2. JAVA_HOME 환경 변수 설정 확인:
```bash
echo $JAVA_HOME
```

3. macOS에서 Java 경로 찾기:
```bash
/usr/libexec/java_home -V
```

### Gradle Wrapper 실행 오류

Gradle Wrapper JAR 파일이 없는 경우:
```bash
./gradlew wrapper --gradle-version 8.5
```
