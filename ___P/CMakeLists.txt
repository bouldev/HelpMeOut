cmake_minimum_required(VERSION 3.14)
project(HelpMeOut)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_C_STANDARD 11)

aux_source_directory(src SOURCES)

add_executable(HelpMeOut)
target_link_libraries(HelpMeOut)
