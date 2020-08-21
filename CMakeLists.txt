cmake_minimum_required(VERSION 3.14)
project(HelpMeOut)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_C_STANDARD 11)

set(JSONCPP_WITH_TESTS OFF)
add_subdirectory(v8-cmake)
add_subdirectory(jsoncpp-1.8.4)

include_directories(v8-cmake/v8/include jsoncpp-1.8.4/include)
aux_source_directory(src SOURCES)

add_executable(HelpMeOut ${SOURCES})
target_link_libraries(HelpMeOut jsoncpp_lib_static v8_base_without_compiler v8_compiler v8_snapshot v8_inspector v8_libplatform)
